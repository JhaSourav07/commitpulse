import os
import sys

# Fix Unicode/emoji printing on Windows terminal
sys.stdout.reconfigure(encoding='utf-8')

# The name of the file where everything will be saved
OUTPUT_FILE = 'files.txt'

# Folders we want to completely ignore
IGNORE_DIRS = {
    '.git',
    '.husky',
    'node_modules',
    '.next',
    'public',
    'assets'
}

# Files we specifically want to ignore
IGNORE_FILES = {
    'package-lock.json',
    OUTPUT_FILE,
    'copy_files.py'
}

# File extensions we consider important
ALLOWED_EXTENSIONS = {
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.mjs',
    '.cjs',
    '.json',
    '.md',
    '.css',
    '.sh'
}

# Specific files without extensions we still want
ALLOWED_SPECIFIC_FILES = {
    '.gitignore',
    '.prettierrc',
    '.env.local.example'
}


def consolidate_files(start_path='.'):
    total_files = 0

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as outfile:

        for root, dirs, files in os.walk(start_path):

            # Skip ignored directories
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

            for file in files:

                # Skip ignored files
                if file in IGNORE_FILES:
                    continue

                _, ext = os.path.splitext(file)

                # Allow only selected file types
                if ext in ALLOWED_EXTENSIONS or file in ALLOWED_SPECIFIC_FILES:

                    filepath = os.path.join(root, file)
                    rel_path = os.path.relpath(filepath, start_path)

                    try:
                        with open(filepath, 'r', encoding='utf-8') as infile:
                            content = infile.read()

                        # Write file separator
                        outfile.write("\n")
                        outfile.write("=" * 60 + "\n")
                        outfile.write(f"FILE: {rel_path}\n")
                        outfile.write("=" * 60 + "\n\n")

                        # Write actual file content
                        outfile.write(content)
                        outfile.write("\n")

                        total_files += 1
                        print(f"Copied: {rel_path}")

                    except Exception as e:
                        print(f"Skipped {rel_path} (Error: {e})")

    print("\n✅ Done!")
    print(f"📁 Total files copied: {total_files}")
    print(f"📄 Output saved to: {OUTPUT_FILE}")


if __name__ == '__main__':
    consolidate_files()