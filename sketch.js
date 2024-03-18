
// Airtable public database.
// TODO : Make sure the information here is 100% public.
var Airtable = require('airtable');
var base = new Airtable({apiKey: 'pat7KyGTCR6YqQtbC.657d08dda97d84301d9deea1f7d1056d2e56ffd9fcf4c2b95343c71033d88220'}).base('appg7vzO0sET17Xm7');

// TODO Wrap the app in a single class.
// Create a local object db
let localdb = new LocalDB()



// TODO this should be in the viz_builder class, that contains the whole app.
// Filters for the data transfer
let viz_config = {

    filters: ["constituents-members", "membership"],
    timeline : true,
    use_position_cache : true
    // years: "timeline"
  
}

// TODO this should be in the viz_builder class, that contains the whole app. And here just define the visualization.
// Configuration for the visualization
let timelineCurve, years, people, vizpeople;
let repeat_order = 5;
// style
let style;
let debug = false;


// Preloading the fonts for the visualizarion from a local directory.
// TODO include the local json or csv with the local database.
function preload() {
  
    fontRoboto = loadFont('./fonts/Roboto-Medium.ttf');
    fontRobotoMedium = loadFont('./fonts/Roboto-Medium.ttf');
  }
  

/**
 * Function to set up the canvas and initialize the local database before drawing the network.
 *
 * 
 * 
 */
function setup(){


    // Create canvas
    // TODO Make the canvas rezisable and adaptable to different screens.
    createCanvas(1200,1600);

    // Create style object
    // TODO style is not used, so remove it.
    style = new VizStyle();

    // Secuence of functions to initialize the local database before drawing the network.
    // The last method builds the visualization, after the local database is ready.

    // TODO this should be called from the viz_builder class.
    initialize_localdb_from_airtable(localdb, localdb_initialization_secuence, 3000);


}

function draw(){

    //TODO this all should be managed by the viz_builder class.
    style.set_background();

    if (localdb.local_network_is_ready) {
            timelineCurve.display();
            vizpeople.update();
    }


}