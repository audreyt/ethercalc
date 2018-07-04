@0xf743d7c210e66991;

using Spk = import "/sandstorm/package.capnp";
# This imports:
#   $SANDSTORM_HOME/latest/usr/include/sandstorm/package.capnp
# Check out that file to see the full, documented package definition format.

const pkgdef :Spk.PackageDefinition = (
  # The package definition. Note that the spk tool looks specifically for the
  # "pkgdef" constant.

  id = "a0n6hwm32zjsrzes8gnjg734dh6jwt7x83xdgytspe761pe2asw0",
  # Your app ID is actually its public key. The private key was placed in
  # your keyring. All updates must be signed with the same key.

  manifest = (
    # This manifest is included in your app package to tell Sandstorm
    # about your app.

    appVersion = 201702210,  # Increment this for every release.
    appTitle = (defaultText = "EtherCalc"),
    appMarketingVersion = (defaultText = "2017.02.21.0"),

    actions = [
      # Define your "new document" handlers here.
      ( title = (defaultText = "New EtherCalc Spreadsheet"),
        nounPhrase = (defaultText = "spreadsheet"),
        command = .myContinueCommand
        # The command to run when starting for the first time. (".myCommand"
        # is just a constant defined at the bottom of the file.)
      )
    ],

    continueCommand = .myContinueCommand,
    # This is the command called to start your app back up after it has been
    # shut down for inactivity. Here we're using the same command as for
    # starting a new instance, but you could use different commands for each
    # case.



    metadata = (
      icons = (
        appGrid = (svg = embed "app-graphics/ethercalc-128.svg"),
        grain = (svg = embed "app-graphics/ethercalc-24.svg"),
        market = (svg = embed "app-graphics/ethercalc-150.svg"),
      ),

      website = "http://ethercalc.net/",
      codeUrl = "https://github.com/audreyt/ethercalc",
      license = (openSource = cpal),
      categories = [office, productivity],

      author = (
        contactEmail = "audreyt@audreyt.org",
        pgpSignature = embed "pgp-signature",
        upstreamAuthor = "Audrey Tang",
      ),
      pgpKeyring = embed "pgp-keyring",

      description = (defaultText = embed "DESCRIPTION.mkdn"),
      shortDescription = (defaultText = "Multi-user Spreadsheet"),

      screenshots = [
        (width = 478, height = 298, png = embed "static/img/davy/gfx/screenshot.png")
      ],

      changeLog = (defaultText = embed "CHANGELOG.mkdn"),
    ),
  ),

  sourceMap = (
    # Here we defined where to look for files to copy into your package. The
    # `spk dev` command actually figures out what files your app needs
    # automatically by running it on a FUSE filesystem. So, the mappings
    # here are only to tell it where to find files that the app wants.
    searchPath = [
      ( sourcePath = "." ),  # Search this directory first.
      ( sourcePath = "/",    # Then search the system root directory.
        hidePaths = [ "home", "proc", "sys" ]
        # You probably don't want the app pulling files from these places,
        # so we hide them. Note that /dev, /var, and /tmp are implicitly
        # hidden because Sandstorm itself provides them.
      )
    ]
  ),

  fileList = "sandstorm-files.list",
  # `spk dev` will write a list of all the files your app uses to this file.
  # You should review it later, before shipping your app.

  alwaysInclude = [],
  # Fill this list with more names of files or directories that should be
  # included in your package, even if not listed in sandstorm-files.list.
  # Use this to force-include stuff that you know you need but which may
  # not have been detected as a dependency during `spk dev`. If you list
  # a directory here, its entire contents will be included recursively.

  bridgeConfig = (
    viewInfo = (
      permissions = [(name = "modify", title = (defaultText = "modify"),
                      description = (defaultText = "allows modifying the spreadsheet"))],
      roles = [(title = (defaultText = "editor"),
                permissions = [true],
                verbPhrase = (defaultText = "can edit"),
                default = true),
               (title = (defaultText = "viewer"),
                permissions = [false],
                verbPhrase = (defaultText = "can view"))]
    )
  )
);

const myContinueCommand :Spk.Manifest.Command = (
  # Here we define the command used to start up your server.
  argv = ["/sandstorm-http-bridge", "33411", "--", "./run_grain.sh"],
  environ = [
    # Note that this defines the *entire* environment seen by your app.
    (key = "PATH", value = "/usr/local/bin:/usr/bin:/bin"),
    (key = "OPENSHIFT_DATA_DIR", value = "/var"),
  ]
);
