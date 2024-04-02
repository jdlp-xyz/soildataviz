// SOIL ROOTS UNEARTHED 

// TODO Wrap the app in a single class.
let debug = true;

// Create visualization
let viz;

// debug
let center_point;

// color controls
//let color_controls;

//canvas background color
let bkg_color;

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

    // Dat.gui controls
    //color_controls = new dat.GUI();
	  //color_controls.add(bkg_color, 'r', 0, 255);

}

function draw(){


  
    // define center point for testing.
    center_point = createVector(width/2, height/2);

    background(150)
    if(localdb.is_ready){

      viz.update();

    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
  }

  let selected_state = 0;

  function mouseReleased() {
    console.log("clicked");

    // let i = parseInt(random(0, viz.stage.viz_particles.length));

    // viz.stage.viz_particles[i].set_state('red');
    // viz.stage.viz_particles[i].state.set_cascade();

    let possible_states = ['local','free'];
    
    // Toggle the state
    
    console.log("changing stage state to " + possible_states[selected_state]);
    viz.stage.set_stage_state(possible_states[selected_state]);
    
    // move the selected state one step
    if(selected_state == 0){
      selected_state = 1;
    }else{
      selected_state = 0;
    }

  }

  