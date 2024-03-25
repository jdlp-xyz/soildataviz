// SOIL ROOTS UNEARTHED 

// TODO Wrap the app in a single class.
let debug = true;

// Create visualization
let viz;

// Create a local object db
let localdb;
// create variables to store the local data that will be loaded.
let localdata_constituents, localdata_exhibitions, localdata_memberships;

// Preloading the fonts for the visualizarion from a local directory.
// TODO include the local json or csv with the local database.
function preload() {
  
    // Load fonts
    fontRoboto = loadFont('./fonts/Roboto-Medium.ttf');
    fontRobotoMedium = loadFont('./fonts/Roboto-Medium.ttf');

    // Load json files with the base data.
    // TODO A next iteration will include a call to the cloud server for updates.
    localdata_constituents = loadJSON('./data/constituents.json');
    localdata_exhibitions = loadJSON('./data/exhibitions.json');
    localdata_memberships = loadJSON('./data/membership.json');

  }
  

function setup(){

    // Initialize the local database
    localdb = new LocalDB();
    viz = new Viz(localdb);

    // Create canvas
    // TODO Make the canvas rezisable and adaptable to different screens.
    createCanvas(windowWidth, windowHeight);

    // Secuence of functions to initialize the local database before drawing the network.
    // The last method builds the visualization, after the local database is ready.

}

function draw(){

    background(150)
    if(localdb.is_ready){

      viz.update();

    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
  }