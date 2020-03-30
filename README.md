# plugin-template

Blank plugin project to get you started.
Includes: 
    - Base configiration of development dependencies.
    - Base configuration of runtime dependencies (i.e. Perun-Core).
    - Linting. Reasonable rules.
    - Npm scripts for building your bundle, running an instance of a local web-server, tests.
    - Minimal bundling configuration:
        - Two entry points, one for development and production each.
        - Loaders for 99% of commonly used file extensions.
        - Proper output configuration to an `Universal Module Definition` library.
        - External specifier for production build, defines resources provided by the host in a production environment.