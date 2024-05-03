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
let localdata_constituents, localdata_exhibitions, localdata_memberships, colors;

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
    colors = loadJSON('./colors.json');

  }


  // let colors = {'main': [0, 255, 0], 
                // 'secondart': [0, 0, 255]};
  
function export_colors_to_json() {
      // creates a file called 'newFile.txt'
    let writer = createWriter('colors.json');
    // write 'Hello world!'' to the file
    writer.write(JSON.stringify(colors));
    // close the PrintWriter and save the file
    writer.close();
}

let dat_gui;

function setup() {

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
  dat_gui = new dat.GUI();

  let gui_functions = {}
  gui_functions['Toggle states'] = function () { test_change_state(); };
  gui_functions['Export colors'] = function () { export_colors_to_json(); };
  gui_functions['Change particle'] = function () {
    if (viz.stage.state.get_label() == 'local') {
      let random_record_id = localdb.get_random_record_id();
      viz.stage.state.transform_local_network(random_record_id);
    }
  };
  //
  dat_gui.add(gui_functions, 'Toggle states');
  dat_gui.add(gui_functions, 'Change particle');
  let color_gui_folder = dat_gui.addFolder('Colors');

  for(let key in colors){
    color_gui_folder.addColor(colors, key);
  }
  color_gui_folder.add(gui_functions, 'Export colors');
  // color_gui_folder.addColor(colors, 'main');
  


}

function draw(){
    noSmooth();

  
    // define center point for testing.
    center_point = createVector(width/2, height/2);

    background(colors.background)
    if(localdb.is_ready){

      viz.update();

    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
  }

 

  function mouseReleased() {
    

  }


  let selected_state = 0;
  function test_change_state() {


    let possible_states = ['global', 'free', 'local','free'];
    
    // Toggle the state
    
    console.log("changing stage state to " + possible_states[selected_state]);
    viz.stage.set_stage_state(possible_states[selected_state]);
    
    // move the selected state one step
    // if(selected_state == 0){
    //   selected_state = 1;
    // }else{
    //   selected_state = 0;
    // }

    if(selected_state < possible_states.length - 1){
      selected_state++;} else { selected_state = 0;}
   
  }

  