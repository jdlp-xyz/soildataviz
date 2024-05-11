// SOIL ROOTS UNEARTHED 

// TODO Wrap the app in a single class.
let debug = true;


// Create url parameters
let printmode;
let print_width = 2895;
let print_height = 3544;
let baked_points;


// Create visualization
// Create a local object db
let viz, localdb, mycanvas, input;
let robotoBlack;

// create variables to store the local data that will be loaded.
let localdata_constituents, localdata_memberships, colors, style, bakedpoints_printmode;

// Preloading the fonts for the visualizarion from a local directory.
function preload() {
  
    // Load fonts
    fontRoboto = loadFont('./fonts/Roboto-Regular.ttf');
    fontRobotoMedium = loadFont('./fonts/Roboto-Medium.ttf');
    robotoBlack = loadFont('./fonts/Roboto-Black.ttf');

    // Data
    localdata_constituents = loadJSON('./data/test/constituents_5_5_2024.json');
    localdata_exhibitions = loadJSON('./data/exhibitions_5_8_2024.json');
    localdata_memberships = loadJSON('./data/test/membership_5_5_2024.json');


    baked_points = { 
      'horizontal' : {
        'printmode': null, 
        'middle': loadJSON('./baked_node_targets_middle.json'), 
        'large': loadJSON('./baked_node_targets_large.json'), 
        'small': null
      },
      'vertical': {
        'printmode': loadJSON('./baked_node_targets.json'),
        'middle': null,
        'large': null,
        'small': null
      }
};

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
  // pixelDensity(1);
  handle_print_mode()
  
  // Create canvas
  // TODO Make the canvas rezisable and adaptable to different screens.
  if(printmode){mycanvas = createCanvas(2895 , 3544);
    console.log("creating print canvas", print_width, print_height);
  }
  else{mycanvas = createCanvas(windowWidth, windowHeight);}

  

  // Initialize the local database
  localdb = new LocalDB();
  viz = new Viz(localdb);

  // Initialize input handler
  input = new VizInput(viz.stage);
  

  // Secuence of functions to initialize the local database before drawing the network.
  // The last method builds the visualization, after the local database is ready.

  // Dat.gui controls

  // dat_gui = new dat.GUI();

  // let gui_functions = {}
  // gui_functions['Toggle states'] = function () { test_change_state(); };
  // gui_functions['Export colors'] = function () { export_colors_to_json(); };
  // gui_functions['Export style'] = function () { export_style_to_json(); };
  // gui_functions['Save image'] = function () { capture_image(); };
  // gui_functions['Export node targets'] = function () { viz.stage.export_node_target_positions(); };
  
  // gui_functions['Change particle'] = function () {
  //   if (viz.stage.state.get_label() == 'local') {
  //     let random_record_id = localdb.get_random_record_id();
  //     viz.stage.state.transform_local_network(random_record_id);
  //   }
  // };
  // //
  // dat_gui.add(gui_functions, 'Toggle states');
  // dat_gui.add(gui_functions, 'Change particle');
  // dat_gui.add(gui_functions, 'Save image');
  // dat_gui.add(gui_functions, 'Export node targets');
  
  // let color_gui_folder = dat_gui.addFolder('Colors');

  // for(let key in colors){
  //   color_gui_folder.addColor(colors, key);
  // }
  // color_gui_folder.add(gui_functions, 'Export colors');
  // let style_gui_folder = dat_gui.addFolder('Style');
  // for(let key in style){
  //   style_gui_folder.add(style, key);
  // }
  // style_gui_folder.add(gui_functions, 'Export style');
  // // color_gui_folder.addColor(colors, 'main');
  


}

function draw(){
    //noSmooth();

  
    // define center point for testing.
    center_point = createVector(width/2, height/2);

    background(colors.background)
    if(localdb.is_ready){
      
      
      input.update();
      viz.update();

    }
}

function windowResized() {
    if(!printmode){
      resizeCanvas(windowWidth, windowHeight);
    }
  }

 

  function mouseReleased() {
    

  }


  let selected_state = 0;
  function test_change_state() {


    let possible_states = ['global', 'free', 'local','free'];
    
    // Toggle the state
    
    console.log("changing stage state to " + possible_states[selected_state]);
    viz.stage.set_stage_state(possible_states[selected_state], null);
    
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
  
function handle_print_mode() {

  // Search for url parameters
  let url_params = new URLSearchParams(window.location.search);

  // Establush default values
  printmode = false;
  // print_width = 2895;
  // print_height = 3544;


  // If printmode activated from url
  if (url_params.get('printmode') != null || !undefined && url_params.get('printmode') == 'true')
     { 
      console.log("Print mode activated."); 
      printmode = true; 
      document.body.style.overflow = 'auto';
      var canvas = document.querySelector('canvas');
      canvas.style.overflow = 'auto';


     }

  // Set width and height for print from url
  if (url_params.get('w') != null || !undefined && url_params.get('h') != null || !undefined && printmode == true) { console.log("Setting width and height for print."); print_width = url_params.get('w'); print_height = url_params.get('h'); }
}

function capture_image(){
  let timestamp = month()+'_'+day()+'_'+year()+'_'+hour()+'_'+minute(); 
  let filename = 'soil_roots_unearted_'+timestamp;
  saveCanvas(mycanvas, filename, 'png')
}

function mouseReleased() {

  input.mouseReleased();

  // if (viz.stage.state instanceof StateStageGlobal) {
  //   input.click_to_local_view();
  // }
}