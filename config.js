var config = {};
config.client = {};

/*-------CHANGE THESE IF NECESSARY---------*/
config.nodejs_port = 8080;
//Set this to true to run in server mode, not displaying the browser window
config.eddb_systems_url = 'https://eddb.io/archive/v4/systems.json';
config.manage_screenshots = true;
//Path where screenshots are created, "\" must be written double "\\"
config.screenshot_path = 'D:\\Privat\\Pictures\\Frontier Developments\\Elite Dangerous';
//Set this to 0 to disable resizing
config.screenshot_maxsize = 1920;
//Set to false to use an image background for better performance
config.client.video_bg = false;
//Set to true to only log travels to unvisited systems, instead of all travels. NOT IMPLEMENTED YET
//config.client.log_unique_only = false;
/* -------------------- */

module.exports = config;