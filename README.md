BetterWeather
=============
BetterWeather is a free OS X Dashboard widget based on the stock weather widget.

It provides some additional useful information, such as:

* Sunrise time
* Sunset time
* Wind chill
* Wind speed
* Wind direction
* Last updated time

It also features the ability to automatically check for updates (it checks the first time you open Dashboard after a reboot or a logout).

Deploying
---------
To deploy the widget to your local Library folder, run `scripts/copy_to_library.sh`. On the first deployment, you will need to manually open widget to "install" it in Dashboard. Once you have an instance of the widget open, you can simply refresh it (⌘-R) after running the deploy script.