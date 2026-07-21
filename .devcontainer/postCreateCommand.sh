#!/usr/bin/env bash

set -eo pipefail

mise trust .

# Required for shell completions
mise use -g usage
mise completion bash --include-bash-completion-lib | sudo tee /usr/share/bash-completion/completions/mise &> /dev/null
mise completion zsh | sudo tee /usr/local/share/zsh/site-functions/_mise &> /dev/null

# This will execute the "enter" hook in `mise.toml` that will install mise tools and pre-commit hooks
eval "$(mise activate bash)"

# Update the interactive shells too
# shellcheck disable=SC2016
echo 'eval "$(mise activate bash)"' >> ~/.bashrc
# shellcheck disable=SC2016
echo 'eval "$(mise activate zsh)"' >> ~/.zshrc
