# linux-desktop

![npm](https://img.shields.io/npm/v/linux-desktop)

This is a module that indexes .desktop files on linux, and then allows you to query them using js. It also converts them to JSON, so

```ini
[Desktop Entry]
Name=Discord
GenericName=Internet Messenger
Exec=/usr/bin/discord
Icon=discord
Type=Application
Categories=Network;InstantMessaging;
Path=/usr/bin
```

becomes

```js
{
  Name: Discord,
  GenericName: 'Internet Messenger',
  Exec: '/usr/bin/discord',
  Icon: '/usr/share/pixmaps/discord.png',
  Type: 'Application',
  Categories: [ 'Network', 'InstantMessaging' ],
  Path: '/usr/bin'
}
```



## Example usage:

```js
var linuxDesktop = require('linux-desktop');

linuxDesktop.indexItems()
	.then(() => {
        console.log(
			linuxDesktop.refineEntry(
				linuxDesktop.findByCommand('discord')
			)
		)
	})

```
