// SOIL ROOTS UNEARTHED 

// TODO Wrap the app in a single class.
let debug = true;

// Create visualization
// Create a local object db
let viz, localdb;

// create variables to store the local data that will be loaded.
let localdata_constituents, localdata_memberships, colors, style;

// Preloading the fonts for the visualizarion from a local directory.
function preload() {
  
    // Load fonts
    fontRoboto = loadFont('./fonts/Roboto-Medium.ttf');
    fontRobotoMedium = loadFont('./fonts/Roboto-Medium.ttf');

    // Data
    localdata_constituents = loadJSON('./data/test/constituents_5_5_2024.json');
    // localdata_exhibitions = loadJSON('./data/exhibitions.json');
    localdata_memberships = loadJSON('./data/test/membership_5_5_2024.json');
    
    // Style
    colors = loadJSON('./colors.json');
    style = loadJSON('./style.json');

  }

function export_colors_to_json() {
      // creates a file called 'newFile.txt'
    let writer = createWriter('colors.json');
    // write 'Hello world!'' to the file
    writer.write(JSON.stringify(colors));
    // close the PrintWriter and save the file
    writer.close();
}

function export_style_to_json() {
  // creates a file called 'newFile.txt'
let writer = createWriter('style.json');
// write 'Hello world!'' to the file
writer.write(JSON.stringify(style));
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
  gui_functions['Export style'] = function () { export_style_to_json(); };
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
  let style_gui_folder = dat_gui.addFolder('Style');
  for(let key in style){
    style_gui_folder.add(style, key);
  }
  style_gui_folder.add(gui_functions, 'Export style');
  // color_gui_folder.addColor(colors, 'main');
  


}

function draw(){
    //noSmooth();

  
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



  // convert hex color to p5 color
  function hexToColor(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? color(parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)) : null;
  }
  
  
  