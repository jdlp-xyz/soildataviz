// viz.js
class Viz {
  constructor(localdb) {

    this.localdb = localdb;
    this.stage = new Stage(this, localdb);

  }

  update() {

    this.stage.update();

  }
}

class Stage {
    constructor(context, localdb) {

        this.context = context;
        this.localdb = localdb;

        // State of the stage. It can be local, global and others implemented later.
        this.state = new StateStageFree(this, null);

        this.viz_particles = [];

        // The quadtree of the stage.

        this.quadtree = new QuadTree(new Rectangle(innerWidth/2, innerHeight/2, innerWidth, innerHeight),4);

        // This is a property of the local stage.
        this.staged_nodes = {
            'focused': null,
            'neighbors': [],
            'secondary': []
        }



        // Test area

        // Create some viznodes
        for(let i = 0; i < 800; i++){

            this.viz_particles.push(new VizParticle(this, "free"));
        }

    }

    update() {

        // Update quadtree where the particles are referenced.
        this.update_quadtree();

        // Update current state.
        this.state.update();

        if(debug){
            text("Stage State: "+ this.state.label, 10,20);
            text("Cascading: "+ this.state.cascading, 10,40);
        }

        // TODO This will be controled by state.
        // Update viz nodes
        // for(let i = 0; i < this.viz_particles.length; i++){
        //     this.viz_particles[i].update();
        //     this.viz_particles[i].show();
        // }
        

        
    }

    // Stage node control
    focus_on_node(record_id){

        // Get the node
        let selected_node = get_single_node_anywhere(record_id);
        
        // Remove the selected node from the neighbors and secondary
        this.staged_nodes.neighbors = this.staged_nodes.neighbors.filter(item => item != selected_node);
        this.staged_nodes.secondary = this.staged_nodes.secondary.filter(item => item != selected_node);

        // Put the node in focus
        this.staged_nodes.focused = selected_node;

        // Focused node's neigbours
        this.staged_nodes.neighbors = selected_node.get_neighbours();

        // Empty the secondary neighbors
        this.staged_nodes.secondary = [];

        // Get Neighbours' neigbours
        for(let i = 0; i < this.staged_nodes.neighbors.length; i++){

            this.staged_nodes.neighbors[i].get_neighbours().forEach(element => {
                
                // If the element is not in the secondary neighbors, push it
                if(!this.staged_nodes.secondary.includes(element)){

                    this.staged_nodes.secondary.push(element);
                }
            });
        }
        
        if(debug){
            console.log("Focused on node: ", this.staged_nodes.focused.semantic_id, " with ", this.staged_nodes.neighbors.length, " neigbours and ", this.staged_nodes.secondary.length, " secondary neigbours");
        }

    }

    /**
     * Updates the quadtree with the current positions of the particles.
     *
     * This function clears the existing quadtree and then iterates over each particle
     * in the `viz_particles` array. For each particle, it creates a new `Point` object
     * with the particle's x and y coordinates, and the particle itself as the data.
     * The `Point` object is then inserted into the quadtree using the `insert` method.
     *
     */
    update_quadtree(){
        // Update quadtree
        this.quadtree.clear();
        // For each particle create a point and insert it in the quadtree
        for(let i = 0; i < this.viz_particles.length; i++){

            let point = new Point(this.viz_particles[i].pos.x, this.viz_particles[i].pos.y, this.viz_particles[i]);
            this.quadtree.insert(point);
        }
    }


    initiate_particle_cascade(state, seed_number, scope){
               
        let target_state = state;

        // Get seed number random selection of particles from the stage 
        let random_indexes = [];
        for (let i = 0; i < seed_number; i++) {
            let random_index = parseInt(random(0, this.viz_particles.length));
            if(!random_indexes.includes(random_index)){
                random_indexes.push(random_index);
            }
        }
        let seed_particles = random_indexes.map(index => this.viz_particles[index]);


        // Change state for the selected nodes and activate cascading
        for (let i = 0; i < seed_particles.length; i++) {

            target_state.context = seed_particles[i];
            seed_particles[i].set_new_state({'cascading': true, 'target_state': target_state, 'seeds': seed_number, 'scope': scope});
           

        }

        // Declare cascading for the stage
        this.cascading = true;


    }

}

// Abstract class that controls the state of the stage.
class StageState {
    
    constructor(context, last_state){

        this.context = context;
        this.last_state = last_state;
        this.next_state = null;
        this.userData = {};
        this.cascading = false; // Is the state cascading to another state?

    }

    

}

// Concrete stage state free
class StateStageFree extends StageState {

    constructor(context, last_state){

        super(context, last_state);
        this.label = "Free";
    
    }

    // This update function manages the stage update method.
    update(){

        // simply passes the update function to each viz particle
        for(let i = 0; i < this.context.viz_particles.length; i++){
            this.context.viz_particles[i].update();
        }

    }





}

class StateStage_test extends StageState {

    constructor(context, last_state){

        super(context, last_state);

        // Animation 
        this.userData.color = color(0,0,200);

    }

    // This update function manages the stage update method.
    update(){

        switch (this.state) {
          case 'intro':
            if (this.last_state != null) {this.intro();} else { this.state = null }
            break;
          case 'outro':
            this.outro();
            break;
          default:
            this.default();
            // default case if none of the above cases match
        }


 
        
    }

    // This is the behavior when the stage is created. After it is satisfied, it passes to default.
    intro(){

        

    }

    // Animation and behavior before creating the next stage.
    outro(){
        
    }

    default(){

        // Update viz particles
        for(let i = 0; i < this.context.viz_particles.length; i++){
        this.context.viz_particles[i].test_collision();
        this.context.viz_particles[i].show();
        }

    }

    // Calls the next state
    setNextState(state){
        
    }

    set_color(color){
        this.color = color;
    }
    set_movement(movement){
        this.movement = movement;
    }
}

// Visualization node
class VizParticle {

    constructor(context, state){

        // Position, physics.
        this.pos = createVector(random(innerWidth), random(innerHeight));
        this.vel = createVector(0,0);
        this.acc = createVector(0,0);
        this.mass = 1;
        this.radius = 10;
        this.perception = 20;
        this.maxSpeed = 10;
        this.maxForce = 0.4;
        this.color = [0,120,0];

        // Parent object
        this.context = context

        // VN State class
        this.state = new VizState(this, [100,0,0], 1);
        this.old_state = null;

        // Slot for db node data.
        this.db_node = null;

        this.colission_results = "0";

        // Random walk variation
        this.random_variation = 1;

        // Cascading
        this.cascading = {
            'cascading': false,
            'target_state': null, // The target state
            'seeds': null, // The amount of particles to convert
            'scope': null // The radius of the cascading
        };

    }

     update(){


       //  this.random_walk();
   //      this.test_collision();
         this.cascadeState(); // If cascading is true, it will convert to the target state.
         this.state.update();
         //this.show()
     }

    show(){
        
        push();
            //noStroke();
            //noFill();
            fill(this.color[0], this.color[1], this.color[2]);
            ellipse(this.pos.x, this.pos.y, this.radius*2, this.radius*2)
        pop();
        
    }

    // Test. It should be on a particular state of the particle.
    random_walk(){
        this.pos.x += random(-this.random_variation, this.random_variation);
        this.pos.y += random(-this.random_variation, this.random_variation);        
    }

    // Test. It needs to be better implemented.
    get_collision(scope){

        // Set the boundary for the detection
        let boundary = new Rectangle(this.pos.x, this.pos.y, scope, scope);
        // Query the quadtree in that boundary
        this.colission_results = this.context.quadtree.query(boundary);

        // Remove the current point from the results (the particle is on userData)
        this.colission_results = this.colission_results.filter(item => item.userData != this);

        return this.colission_results;
        
    }

    set_new_state(cascading){

        console.log("Setting new state! to", this);
        
        //Store the state values in the old state
        this.old_state = this.state;
        this.state = cascading.target_state;
        this.state.cascading = cascading;

    }

    cascadeState(target_state, seeds, scope){

        // To cascade, the particle and the stage need to be cascading
        if(this.cascading.cascading && this.context.cascading){

            if (seeds > 0) {

                // Get the collision results
                let collision_results = this.get_collision(this.perception);
                
                if(collision_results.length > 0){
                    // Order the results by distance
                    collision_results.sort((a, b) => {
                    return a.pos.dist(this.pos) - b.pos.dist(this.pos);
                    })
                
                    // Convert the first result to new state
                    collision_results[0].set_new_state({'cascading': true, 'target_state': target_state, 'seeds': seeds - 1, 'scope': scope}); 

                    // Spend a seed
                    this.state.seeds--;
                    // Add scope to perception
                    this.perception += scope;
                    
                } else {

                    //Add scope to perception
                    this.perception += scope;

                }
            } } else { return;}
        
        // If debug, show the perception ring
            //if(debug){
                push();
                    noFill();
                    strokeWeight(3)
                    stroke('red');
                    ellipse(this.pos.x, this.pos.y, this.perception, this.perception);
                pop();
//            }
  
    }

}

// This should be more general
class VizState {

    constructor(context, color, variation){
        this.context = context;
        this.color = color; // inputs as an array
        this.variation = variation;

        // Inject data into context particle
        this.context.color = this.color;

        this.context.random_variation = this.variation;
    }

    update(){


        this.context.random_walk();
        this.inject_data();
        this.context.show();

    }

    inject_data(){
    
        if(this.context.color != this.color){
            this.color = this.context.color;
        }
        // if(this.context.variation != this.variation){
        //     this.variation = this.context.variation;}

    }


}