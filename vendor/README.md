# Vendored packages

`assemblyscript-0.0.0.tgz` is built from
[`bertkdowns/assemblyscript@0edc583`](https://github.com/bertkdowns/assemblyscript/commit/0edc583ca59d9785edc35f665030e91252273d8c).

The archive is vendored because that commit does not track its generated
`dist/` files and does not define an npm `prepare` script. Installing the Git
dependency directly therefore produces an unusable package with an empty
`dist/` directory.
