"""Empaqueta la skill atiende-ia como .skill incluyendo el codigo del repo.

El .skill resultante trae la skill y una copia de todo el codigo en assets/source/,
para crear un portal nuevo en un chat vacio sin acceso al repositorio.
Antes de comprimir revisa que no haya secretos; si encuentra alguno, se detiene.

Uso (desde la raiz del repo):
    python .claude/skills/atiende-ia/scripts/package_skill.py [carpeta_salida]
"""

import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

SKILL_NAME = "atiende-ia"
SKILL_DIR = Path(".claude/skills") / SKILL_NAME
EXCLUDE_PREFIXES = (".claude/",)
ALLOWED_ENV_FILES = {".env.example"}

SECRET_PATTERNS = {
    "API key de ElevenLabs": re.compile(r"\bsk_[a-f0-9]{30,}"),
    "secreto de webhook de ElevenLabs": re.compile(r"\bwsec_[a-f0-9]{30,}"),
    "Account SID de Twilio": re.compile(r"\bAC[a-f0-9]{32}\b"),
    "token de GitHub": re.compile(r"\bgh[opsu]_[A-Za-z0-9]{30,}"),
    "cadena de conexion de Postgres con host real": re.compile(r"postgres(ql)?://[^\s\"']*(neon\.tech|supabase\.co|rds\.amazonaws\.com)"),
    "client secret de Google": re.compile(r"\bGOCSPX-[A-Za-z0-9_-]{20,}"),
    "API key de OpenAI": re.compile(r"\bsk-(proj-)?[A-Za-z0-9_-]{32,}"),
}


def git_files(repo: Path) -> list[str]:
    out = subprocess.run(
        ["git", "-c", f"safe.directory={repo.as_posix()}", "ls-files"],
        cwd=repo, capture_output=True, text=True, check=True,
    ).stdout
    files = []
    for f in out.splitlines():
        name = Path(f).name
        if f.startswith(EXCLUDE_PREFIXES):
            continue
        if name.startswith(".env") and name not in ALLOWED_ENV_FILES:
            continue
        files.append(f)
    return files


def scan(root: Path) -> list[str]:
    problems = []
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        for label, pattern in SECRET_PATTERNS.items():
            if pattern.search(text):
                problems.append(f"{path.relative_to(root)}: posible {label}")
    return problems


def main():
    repo = Path.cwd().resolve()
    if not (repo / SKILL_DIR / "SKILL.md").exists():
        raise SystemExit("Ejecuta el script desde la raiz del repo (no se encontro la skill).")
    out_dir = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else repo
    out_dir.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as tmp:
        staged = Path(tmp) / SKILL_NAME
        shutil.copytree(repo / SKILL_DIR, staged, ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
        files = git_files(repo)
        for f in files:
            dest = staged / "assets" / "source" / f
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(repo / f, dest)

        problems = scan(staged)
        if problems:
            print("No se empaqueto: se encontraron posibles secretos:")
            for p in problems:
                print("  -", p)
            raise SystemExit(1)

        target = out_dir / f"{SKILL_NAME}.skill"
        with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as zf:
            for path in sorted(staged.rglob("*")):
                if path.is_file():
                    zf.write(path, path.relative_to(staged.parent))

    print(f"OK: {target} ({target.stat().st_size / 1024:.0f} KB, {len(files)} archivos del codigo en assets/source/)")


if __name__ == "__main__":
    main()
