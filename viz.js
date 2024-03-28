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

        this.staged_nodes = {
            'focused': null,
            'neighbors': [],
            'secondary': []
        }
       

        // List of viz particles
        this.viz_particles = [];

        // The quadtree of the stage.
        this.quadtree = new QuadTree(new Rectangle(innerWidth/2, innerHeight/2, innerWidth, innerHeight),4);

        // Cascading to a new stage
        this.cascading = false;

        // State of the stage. It can be local, global and others implemented later.
        this.state = new StateStageFree(this);
        this.old_state = null;
        console.log("state:",this.state)

        // Test area

        // Create some viznodes
        for(let i = 0; i < 600; i++){

            this.viz_particles.push(new VizParticle(this, "free"));
        }

       
    }

    update() {

        // Update quadtree where the particles are referenced.
        this.update_quadtree();

        // Update current state.
        this.state.update();

        if(debug){
            text("Cascading: "+ this.state.cascading, 10,40);
            text("Framerate: "+ parseInt(frameRate()), 10,60);

            // Amount of cascading particles

            // From viz_particles, filter all the particles that have a cascading state.
            let particles_rippling = this.viz_particles.filter(particle => particle.state.cascade == true);
            text("Amount of cascading particles: " + particles_rippling.length, 10,80);
        }
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

    // This method will start a cascading to a new state of the particles. It ment to be called once.
    cascade_particles_to_new_state(target_state_string){

        // If the stage is currently cascading, return
        if(this.cascading){console.log("Cascading already in progress, return");return;}
        
        // Reference the new state string
        this.cascade_target_state_string = target_state_string;

        //bug fix
        console.log("label:",this.state)

        // If the current state and the target state are the same, return
        if(this.state.get_label() == this.cascade_target_state_string){console.log("Cascading to the same state, return");return;}

        // Cascade a random elegible particle
        for(let i = 0; i <5; i++){
            this.cascade_random_particle(this.cascade_target_state_string);
        }
        // Declare the cascade state
        this.cascading = true;

    }

    // This method will manage the cascading process in the update loop.
    update_cascading(){
        console.log("updating cascading")

        // Actual cascading particles
        let cascading_particles = this.viz_particles.filter(particle => particle.state.cascade == true);

        // filter the particles in viz_particles that are in the old state
        let particles_old_state = this.viz_particles.filter(particle => particle.state.get_label() == this.cascade_old_state_string);

        // If there are not cascading particles and are remaining particles in the old state, create new cascades
        if(cascading_particles.length < 100 && particles_old_state.length > 0){
            console.log("Cascading again!")
            if(this.cascade_tries == undefined){this.cascade_tries = 10}

            for(let i = 0; i < this.cascade_tries; i++){
                this.cascade_random_particle(this.cascade_target_state_string);
                
            }
            this.cascade_tries += 5;
        }

        // Condition to end cascade
        if(cascading_particles.length == 0 && particles_old_state.length == 0){this.cascading = false; this.cascade_tries = 0;
            if(debug){console.log("Cascading finished!")};
        }
        
    }

    cascade_random_particle(selected_state_string){

        // Filter the elegible particles
        let available_particles = this.viz_particles.filter(particle => particle.state.label != selected_state_string && particle.state.state_locked == false);
       //let available_particles = this.viz_particles

       if(available_particles.length > 0){
            // Pick a random particle
            let random_particle = available_particles[parseInt(random(available_particles.length))];

            // Set the state of the random particle
            random_particle.set_state(selected_state_string);
            
            // Set the cascade state of the random particle
            random_particle.state.set_cascade();
       }
    }

    get_old_state(){
        if(this.old_state != null){
            return this.old_state;}
    }

    get_state(){
        return this.state;
    }

    // Changes the stages state
    set_stage_state(target_state_string, extra_data)    {

        console.log("changing state to:", target_state_string)        
        // Keep the old state if there's one
        if(this.state != null){this.old_state = this.state;}

        // Picks the state from a switch, based on the key
         switch(target_state_string){
        
            case 'free':
                this.state = new StateStageFree(this)
                break;
            case 'local':
                this.state = new StateStageLocal(this, "recU2fzo1HzuU5t3q")
                console.log("changed state to:", this.state);
                break;
            default:
                this.state = new StateStageFree(this)
                console.log("helloooooo")
                break;

        }

    }
    
}

// Abstract class that controls the state of the stage.
class StageState {
    
    constructor(context){

        this.context = context;
        this.next_state = null;
        this.userData = {};
        this.cascading = false; // Is the state cascading to another state?
        this.label = 'no label'

    }

    get_label(){
        return this.label
    }

    

}

// Concrete stage state free
class StateStageFree extends StageState {

    constructor(context){

        console.log("initiating free state");
        
        super(context);
        console.log(this.context)
        this.label = "free";
        console.log("label:",this.get_label())

        // Unlock all the particles
        for(let i = 0; i < this.context.viz_particles.length; i++){
            this.context.viz_particles[i].state.unlock_state();
        }

        // Particles are free?
        this.particles_are_free = false;

       
    
    }

    // This update function manages the stage update method.
    update(){

         // Cascade all the particles to the free state
         this.update_free_particles();

        // simply passes the update function to each viz particle
        for(let i = 0; i < this.context.viz_particles.length; i++){
            this.context.viz_particles[i].update();
        }

        //If the particles are cascading, update them.
        if(this.context.cascading){this.context.update_cascading();}

    }

    // This method will search for locked and other state particles and will return them to free state
    update_free_particles(){

        if(this.particles_are_free == true) {return;} else {
            // filter the locked state particles in viz particles
            let locked_particles = this.context.viz_particles.filter(p => p.state.it_is_locked());

            // filter all the particles whose state is not free
            let not_free_particles = this.context.viz_particles.filter(p => p.state.get_label() != "free");

            // unlock them
            locked_particles.forEach(p => p.state.unlock_state());

            // Clean the user data for the not free particles
            not_free_particles.forEach(p => p.clean_user_data());

            // turn them into free state
            // TODO: this should be cascading
            not_free_particles.forEach(p => p.set_state("free"));

            // Declare that particles are free
            this.particles_are_free = true;
        }
            
        
    }

}

class StateStageLocal extends StageState {

    constructor(context, focused_record_id){
        super(context);

        // Everytime this state is created, it must carry one record id to build a local network.
        this.focused_record_id = focused_record_id;

        this.label = "local";

        // Build the local network
        this.build_local_particle_network(this.focused_record_id);

        
    
    }

    // This update function manages the stage update method.
    update(){

        // The updates are differenciated so local particles are on top of free particles

        // Get the particles in free state
        let free_particles = this.context.viz_particles.filter(p => p.state.get_label() == "free");
        //update them
        free_particles.forEach(p => p.update());

        // Get the particles in local state
        let local_particles = this.context.viz_particles.filter(p => p.state.get_label() == "local");

        // update them
        local_particles.forEach(p => p.update());



        //If the particles are cascading, update them.
        if(this.context.cascading){this.context.update_cascading();}

    }

    build_local_particle_network(record_id){
        
        // Random particles to be assigned as part of the local network
        let selected_particles = [];

        // Focus on a node, get its neighbors and secondary, populate the staged nodes
        this.context.focus_on_node(record_id);

        // Get the number of nodes needed to build the network
        let number_of_particles_for_local_network = this.context.staged_nodes['neighbors'].length + this.context.staged_nodes['secondary'].length + 1;

        // Get the particle in the quadtree more nearest to the center
        let search_radius = 100;
        let center = new Circle(innerWidth/2, innerHeight/2, search_radius);
        let center_particles = this.context.quadtree.query(center);

        // Asign a center particle to the selected particles
        selected_particles.push(center_particles[0].userData);

        // In the next iteraion we can use zones of exclusion for selecting the rest of the nodes.
        // for now, just pick random nodes
        while (selected_particles.length < number_of_particles_for_local_network){

            // Pick a random index
            let random_index = parseInt(random(this.context.viz_particles.length));
            // If the particle is not already present in the selected particles, push it.
            if(selected_particles.indexOf(this.context.viz_particles[random_index]) === -1){
                selected_particles.push(this.context.viz_particles[random_index]);
            }
        }

        // In a variable, Filter all the viz particles that are not in the selected particles
        let excluded_particles = this.context.viz_particles.filter(particle => selected_particles.indexOf(particle) === -1);

        // Lock the state of the excluded particles
        excluded_particles.forEach(particle => particle.state.lock_state());

        console.log("Local network built, selected_particles: " + selected_particles.length);

        // change the state of the selected particles
        selected_particles.forEach(particle => particle.set_state('local'));

        // TODO: This should be a separate method
        // Asign the db nodes to the selected particles
        // Asign the focus particle
        selected_particles[0].userData.db_node = this.context.staged_nodes['focused'];
        // Asign the neighbors
        for(let i = 0; i < this.context.staged_nodes['neighbors'].length; i++){
            selected_particles[i+1].userData.db_node = this.context.staged_nodes['neighbors'][i];
        }
        // Asign the secondary neighbors
        for(let i = 0; i < this.context.staged_nodes['secondary'].length; i++){
            selected_particles[i+1+this.context.staged_nodes['neighbors'].length].userData.db_node = this.context.staged_nodes['secondary'][i];
        }

        // Asign a label to the selected particles from the db node
        selected_particles.forEach(particle => particle.label = particle.userData.db_node.get_label());

        console.table(selected_particles);

    }



}



// Visualization node
class VizParticle {

    constructor(context){

        // Position, physics.
        this.pos = createVector(random(innerWidth), random(innerHeight));
        this.vel = createVector(0,0);
        this.acc = createVector(0,0);
        this.mass = 1;
        this.radius = 10;
        this.perception = 20;
        this.maxSpeed = 10;
        this.maxForce = 0.4;
        this.color = [0,0,0];

        // Parent object
        this.context = context

        // VN State class
        this.state = null;
        this.set_state('free');

        this.old_state = null;

        // Slot for db node data.
        this.userData = {}

        this.colission_results = "0";

        // Random walk variation
        this.random_variation = 1;


    }

    update(){
       this.state.update();
    }

    clean_user_data(){
        this.userData = {}
    }

    show_ellipse(){
        
        push();
            noStroke();
            //noFill();
            fill(this.state.color[0], this.state.color[1], this.state.color[2]);
          //  fill(this.color[0], this.color[1], this.color[2]);
            ellipse(this.pos.x, this.pos.y, this.radius*2, this.radius*2)
        pop();
        
    }

    set_label(label_string){
        this.label = label_string;
    }

    show_label(){

        if(this.label != null && this.label != "undefined"){
            push();
                textAlign(CENTER, TOP);
                textFont(fontRoboto);
                text(this.label, this.pos.x, this.pos.y+this.radius*1.5);
            pop();
        }

    }

    // Random walk for testing.
    random_walk(){
        this.pos.x += random(-this.random_variation, this.random_variation);
        this.pos.y += random(-this.random_variation, this.random_variation);        
    }



    // Gets particle references from the quadtree.
    get_collision(scope, shape){

        // The area to query
        let boundary;

        // Create the apropiate object for query, depending on the shape
        switch(shape){
            case 'circle':
                boundary = new Circle(this.pos.x, this.pos.y, scope);
                break;
            case 'square':
                boundary = new Rectangle(this.pos.x, this.pos.y, scope, scope);
                break;
            default:
                boundary = new Rectangle(this.pos.x, this.pos.y, scope, scope);
                break;
        }

        // Query the quadtree in that boundary
        this.colission_results = this.context.quadtree.query(boundary);

        // Remove the current point from the results (the particle is on userData)
        this.colission_results = this.colission_results.filter(item => item.userData != this);

        // Return the results
        return this.colission_results;
        
    }

    // Creates a ripple from the particle, sensing its neigbours. It grows until reaches a contact limit.
    ripple_out(contact_limit){

       
        // Defines a ripple radius in the particle
        if(this.ripple_radius == undefined){this.ripple_radius = 0;}
        // Defines the ripple contacts
        if(this.ripple_contacts == undefined){this.ripple_contacts = [];}

        // Keep ripple while the ripple contacts are under the limit
        if(this.ripple_contacts.length < contact_limit){
            // Debug: Draw a circle that represents the ripple
            if (debug){
                
                // The alpha of the ripple is inverse proportional to the ripple radius
                let ripplealpha = 255 - (this.ripple_radius * 3);

                // push();
                //     stroke(255, ripplealpha);
                //     strokeWeight(2);
                //     noFill();
                //     ellipse(this.pos.x, this.pos.y, this.ripple_radius, this.ripple_radius);
                // pop();
            }

            // Checks for neighbours inside the radius
            let colission_results = this.get_collision(this.ripple_radius, 'circle');

            // If the lenght of the collision results is greater than the length of the ripple contacts, push the last element to that array
            if(colission_results.length > this.ripple_contacts.length){
                this.ripple_contacts.push(colission_results[colission_results.length-1]);
            }

            // Adds to the ripple counter.
            this.ripple_radius = this.ripple_radius + 15;
        } else {
            // Once the contact limit is reached, stop the ripple
            this.state.cascade = false;
            // reset the ripple radius
            this.ripple_radius = 0;
        }
 
            
        
    }


    // Changes the state object of the particle
    set_state(state_key){
        
        // Keep the old state if there's one
        if(this.state != null){this.old_state = this.state;}
        
        // If there's a state already and its locked, break the function
        if(this.state != null && this.state.it_is_locked()){return;}

        // Picks the state from a switch, based on the key
         switch(state_key){
        
            case 'free':
                this.state = new VizParticleStateFree(this);
                this.state.set_variation(5);
                break;
            case 'local':
                this.state = new VizParticleStateLocal(this);
                break;
            default:
                this.state = new VizParticleState(this);
                this.state.set_color([255,255,255]);
                this.state.set_variation(1);
                break;

        }

    }

    // Makes a ripple and changes the state of the contacts in a chain reaction.
    cascade_state(state_key, max_contact_limit){

        // Make a contact counter
        if(this.contact_counter == undefined){this.contact_counter = 0;}

        // If there are ripple contacts and their state is different, change it and make it ripple.
        if(this.ripple_contacts.length > 0){
            
            // Filter the contacts that have a different state label than this one
            var new_ripple_contacts = this.ripple_contacts.filter(function(contact){
                return contact.userData.state.get_label() != state_key;
            })

            // If there are new contacts, change their state and make them ripple
                if(new_ripple_contacts.length > 0){
                    // Apply the new state to the first contact that is not in the same state
                    for(let i = 0; i < new_ripple_contacts.length; i++){
                        
                        if(new_ripple_contacts[i].userData.state.get_label() != state_key){
                            
                            // Set the state of the contact
                            new_ripple_contacts[i].userData.set_state(state_key);
                            // Make this contact ripple and cascade
                            new_ripple_contacts[i].userData.state.set_cascade();
                            this.contact_counter++;

                        // turn off the ripple and cascade
          
                            break;
                        }
                    }
                        
                }
            

            
                
        }

        if(this.contact_counter > max_contact_limit){ this.state.stop_cascade();}
    }
}

// This should be more general
class VizParticleState {

    constructor(context){

        this.context = context;
        this.color = [0,0,0]; // inputs as an array
        this.variation = 1; // Variation for the random walk
        this.label = "no_label";

        // Is this state cascading?
        this.cascade = false;
        // This particle state can change or it's locked
        this.state_locked = false;
    }

    update(){

    }

    set_context(context){
        this.context = context;
    }

    set_variation(variation){
        this.variation = variation;
    }

    set_label(label){
        this.label = label;
    }

    get_label(){
        return this.label;
    }

    // Returns true or false if the state is locked
    it_is_locked(){
        return this.state_locked;
    }

    set_color(color_array){
        this.color = color_array;
    }

    lock_state(){
        this.state_locked = true;
    }
    unlock_state(){
        this.state_locked = false;
    }

    // Injects specific data to the context object
    inject_data(){
    }

    // Initiates the cascade
    set_cascade(){
        this.cascade = true;
    }
    //Stops the cascade
    stop_cascade(){
        this.cascade = false;
    }

}

class VizParticleStateLocal extends VizParticleState {
    constructor(context){
        super(context);
        this.color = [0,0,255];
        this.set_label("local");
        this.variation = 0;
    }

    update(){
      //  console.log("calling update from local state");
        this.inject_data();
       // this.context.random_walk();
        
        // Show
        this.context.show_ellipse();
        //If the context particle has a label, show it
        if(this.context.label != undefined){
            this.context.show_label();
        }
        
        if(this.cascade == true){
            this.context.ripple_out(10);
            this.context.cascade_state(this.label, 10);}
        
        
    }


}

class VizParticleStateFree extends VizParticleState {
    constructor(context){
        super(context);
        this.color = [170,170,170];
        this.set_label("free");
        this.variation = 1;
    }

    

    update(){
       // console.log("calling update from free state");
        this.inject_data();
        this.context.random_walk();
        this.context.show_ellipse();
        if(this.cascade == true){
            this.context.ripple_out(10);
            this.context.cascade_state(this.label, 10);}
    }
}