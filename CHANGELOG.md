# Prysmo Changelog

All notable changes to Prysmo will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.2] (2019-01-04)

### Fixed
- Fixed ugly exception that used to pop up when you `.close` a closed instance. Now we throw a custom exception.

### Added
- We now send an error message to the client when, an error is thrown inside a [debug endpoint](TODO).
- Add the method [`prysmo.entity`](TODO) for registering multiple endpoints through a batch object.

## [0.0.1] (2018-12-31)

### Added
- First version of the framework.

[0.0.1]: https://gitlab.com/prysmo/prysmo/tags/v0.0.1
[0.0.2]: https://gitlab.com/prysmo/prysmo/tags/v0.0.2
