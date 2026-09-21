#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "$0")/.." && pwd)"
version="$(node -p "require('${project_root}/manifest.json').version")"
output_dir="${project_root}/dist"
output_file="${output_dir}/docode-v${version}.zip"
temporary_dir="$(mktemp -d)"

cleanup() {
  rm -rf "${temporary_dir}"
}
trap cleanup EXIT

mkdir -p "${output_dir}"
cd "${project_root}"
zip -q -r "${temporary_dir}/docode.zip" manifest.json src icons -x "*/.DS_Store"
unzip -q -t "${temporary_dir}/docode.zip"
cp "${temporary_dir}/docode.zip" "${output_file}"

echo "Created ${output_file}"
