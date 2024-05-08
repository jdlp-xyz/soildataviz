// viz.js
class Viz {
  constructor(localdb) {

    this.localdb = localdb;
    this.stage = new Stage(this, localdb);

  }

  update() {

    this.stage.update();

  }

  get_screen_orientation() {
    let screen_orientation = width > height;
    if(screen_orientation == true){
        return 'horizontal';} else {
        return 'vertical';}
        
    }
  }


class Stage {
    constructor(context, localdb) {

        this.context = context;
        this.localdb = localdb;

        // Local network
        this.staged_nodes = {
            'focused': null,
            'neighbours': [],
            'secondary': []
        }

        // List of viz particles
        this.viz_particles = [];

        // The quadtree of the stage.
        this.quadtree = new QuadTree(new Rectangle(width/2, height/2, width, height),4);

        // Cascading to a new stage
        this.cascading = false;

        // State of the stage. It can be local, global and others implemented later.
        this.state = new StateStageFree(this);
        this.old_state = null;
        this.baked_data = {
            'node_targets' : {
                'horizontal': [],
                'vertical': [] }
        }
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
        this.show_debug();

    }

    show_debug() {
        if(debug){
            text("Framerate: "+ parseInt(frameRate()), 10,20);
            text("Width: "+ width+" Height: "+ height, 10,40);


        }
    }

    // Stage node control
    


    update_quadtree(){
        // Update quadtree
        this.quadtree.clear();
        // For each particle create a point and insert it in the quadtree
        if(this.viz_particles.length > 0){
            for(let i = 0; i < this.viz_particles.length; i++){

                let point = new Point(this.viz_particles[i].pos.x, this.viz_particles[i].pos.y, this.viz_particles[i]);

                this.quadtree.insert(point);
            }
         }
    }

    // Method to bake the target positions of the node targets
    bake_node_target_positions(){
        
        // Establish a place to store the target positions depending on the screen orientation
        let place_to_store;
        if(this.context.get_screen_orientation() == 'horizontal'){
            place_to_store = this.baked_data.node_targets.horizontal;
        } else { 
            place_to_store = this.baked_data.node_targets.vertical;}

        // Clear the place to store
        place_to_store = [];
        
        // Node targets
        let node_targets = this.state.targets.filter(target => target.userData.is_node_target == true);

        for (let i = 0; i < node_targets.length; i++) {
            
            let target_info = {
            'is_node_target': true,
            'particle': null,
            'db_node_record_id': node_targets[i].userData.db_node.record_id,
            'target_pos_x': node_targets[i].pos.x,
            'target_pos_y': node_targets[i].pos.y
             }
            
            place_to_store.push(target_info);
        }

        console.log(place_to_store.length, " "+this.context.get_screen_orientation()+" node targets positions baked")
    }

    export_node_target_positions(){
        
        let node_target_positions = [];
        
        // Node targets
        let node_targets = this.state.targets.filter(target => target.userData.is_node_target == true);

        for (let i = 0; i < node_targets.length; i++) {
            
            let target_info = {
            'is_node_target': true,
            'particle': null,
            'db_node_record_id': node_targets[i].userData.db_node.record_id,
            'target_pos_x': node_targets[i].pos.x,
            'target_pos_y': node_targets[i].pos.y
             }
            
            node_target_positions.push(target_info);
        }

        let writer = createWriter('baked_node_targets.json');
        // write 'Hello world!'' to the file
        writer.write(JSON.stringify(node_target_positions));
        // close the PrintWriter and save the file
        writer.close();
    }

    // This method will start a cascading to a new state of the particles. It ment to be called once.
    cascade_particles_to_new_state(target_state_string){

        // If the stage is currently cascading, return
        if(this.cascading){console.log("Cascading already in progress, return");return;}
        
        // Reference the new state string
        this.cascade_target_state_string = target_state_string;

        //bug fix
        //console.log("label:",this.state)

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
                this.state = new StateStageLocal(this, 'rec1CDshlHNbEqN01') // for testing only
                console.log("changed state to:", this.state);
                break;
            case 'global':
                this.state = new StateStageGlobal(this);
                break;
            default:
                this.state = new StateStageFree(this)
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
        // if(this.context.cascading){this.context.update_cascading();}

    }

    // This method will search for locked and other state particles and will return them to free state
    update_free_particles(){

        if(this.particles_are_free == true) {return;} else {
            // filter the locked state particles in viz particles
            let locked_particles = this.context.viz_particles.filter(p => p.state.it_is_locked());

            // filter all the particles whose state is not free
            let not_free_particles = this.context.viz_particles.filter(p => p.state.get_label() != "free");

            // unlock them
            if(locked_particles.length > 0){
            locked_particles.forEach(p => p.state.unlock_state());}

           
            if(not_free_particles.length > 0){
                // Clean the user data for the not free particles
                not_free_particles.forEach(p => p.clean_user_data());
                // turn them into free state
                not_free_particles.forEach(p => p.set_state("free"));
            }

            // Declare that particles are free
            this.particles_are_free = true;
        }
            
        
    }

}

class StateStageLocal extends StageState {

    constructor(context, focused_record_id){
        super(context);

        // Everytime this state is created, it must carry one record id to build a local network.
        this.initial_focused_record_id = focused_record_id;

        this.label = "local";

        // Where stage local particles will be stored
        this.local_particles = []

        // Testing purposes
        this.transform_local_network(focused_record_id);
        // dat_gui.add(gui_functions, 'Change particle focus');

        
    
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
        // Filter different palces in stage from the local
        let secondary_particles = local_particles.filter(p => p.userData.place_in_stage == "secondary");
        let neighbour_particles = local_particles.filter(p => p.userData.place_in_stage == "neighbours");
        let focused_particle = local_particles.filter(p => p.userData.place_in_stage == "focused")[0];

        // update them
        //local_particles.forEach(p => p.update());
        secondary_particles.forEach(p => p.update());
        neighbour_particles.forEach(p => p.update());
        focused_particle.update();



        //If the particles are cascading, update them.
        if(this.context.cascading){this.context.update_cascading();}

    }

    clear_targets_for_local_particles(){
        // Check if there are any local particles
        if(this.local_particles == 0){return;} else {

            // Clear the targets
            for (let i = 0; i < this.local_particles.length; i++) {
                this.local_particles[i].state.target.host = [];
                this.local_particles[i].state.target.guest = null;
            }
        }
    }

    set_targets_for_local_particles(){

        // Check if there are any local particles
        if(this.local_particles == 0){return;} else {

            // For the focused particle, the target is itself
            let focused_particle = this.local_particles[0];
            let focused_target = new VizTargetLocal(this.local_particles[0], this.local_particles[0]);
            focused_particle.state.target.host.push(focused_target);
            focused_particle.state.target.guest = focused_target;

            // For each of the neighbours, set target to the focused particle
            // Filter the neibours
            let neigbours = this.local_particles.filter(p => p.userData.place_in_stage == "neighbours");
            for(let i = 0; i < neigbours.length; i++){
                let target = new VizTargetLocal(this.local_particles[0], neigbours[i]);
                // Referencing the target in the host
                this.local_particles[0].state.target.host.push(target);
                neigbours[i].state.target.guest = target;
            }

            // for the secondary, put the host in the first present neigbour
            // filter the secondarty
            let secondary = this.local_particles.filter(p => p.userData.place_in_stage == "secondary");
            
            for(let i = 0; i < secondary.length; i++){
                
                let particle_first_neighbour = secondary[i].context.state.get_present_neighbours_for_secondary(secondary[i])[0];

                console.log("particle_first_neigbour",particle_first_neighbour)
                let target = new VizTargetLocal(particle_first_neighbour, secondary[i]);
                particle_first_neighbour.state.target.host.push(target);
                secondary[i].state.target.guest = target;
            }

        }
    }

    // Transform local network
    // This method will take the focused node and then transform the local network around it, adding the targets and edges between the nodes.
    async transform_local_network(focused_record_id){

        // Focus on a node
        this.staged_nodes = this.focus_on_db_node(focused_record_id);

        // If there are particles in the local network, clear the targets
        this.clear_targets_for_local_particles();

        // let response = await this.transform_particles_around_staged_nodes(this.staged_nodes);
       
        // transform particles around staged nodes, and than callback set target for local network
        this.transform_particles_around_staged_nodes().then(response => this.set_targets_for_local_particles());

    }

    // This will focus on a node an then transform the local particles. Targets are to be defined after this method.
    async transform_particles_around_staged_nodes(){
        // Subfunction definition

        const check_if_dbnode_present = (particle) => {
            // console.log(focused_nodes)
            // Particle record id
            let particle_record_id = particle.userData.db_node.record_id;
            console.log("particle",particle.label, "record id:",particle_record_id)
            let focused_nodes = this.staged_nodes;
            
            let present_node = []

            // check for the node in the focused nodes
            for(let i = 0; i < focused_nodes['focused'].length; i++){

                if(focused_nodes['focused'][i].record_id == particle_record_id){
                    present_node.push(focused_nodes['focused'][i]);
                }
            }
            for(let i = 0; i < focused_nodes['neighbours'].length; i++){

                if(focused_nodes['neighbours'][i].record_id == particle_record_id){
                    present_node.push(focused_nodes['neighbours'][i]);
                }
            }

            for(let i = 0; i < focused_nodes['secondary'].length; i++){

                if(focused_nodes['secondary'][i].record_id == particle_record_id){
                    present_node.push(focused_nodes['secondary'][i]);
                }
            }

            // Check if the particle record id is in the nodes array
            // present_node = nodes_array.filter(node => node.record_id == particle_record_id);

            if(present_node.length > 0){return true;} else {return false;}

        }

        // Make new Promise
        return new Promise((resolve, reject) => {
            
            // Get the focused node
            let focused_nodes = this.staged_nodes;

            if (this.local_particles.length > 0) {

                // If there are particles in the local network,look for nodes to transform to free
                let particles_to_free = [];

                for(let i = 0; i < this.local_particles.length; i++){
                    let is_present = check_if_dbnode_present(this.local_particles[i]);
                    if (is_present == true) { continue } else { particles_to_free.push(this.local_particles[i]);}
                }

                // this.local_particles.forEach(particle => {
                //     let is_present = check_if_dbnode_present(particle, focused_nodes);
                //     if (is_present == true) { particles_to_free.push(particle); }
                // })

                // Remove the particles to free from the local network
                this.local_particles = this.local_particles.filter(particle => particles_to_free.includes(particle) == false);

                // Free them
                particles_to_free.forEach(particle => {
                    // console.log('freeing', particle)
                    particle.set_state('free');
                })
                console.log('freeing', particles_to_free.length, 'particles')
            }

            console.log("local network length:", this.local_particles.length)
            // Transform all particles from the focused nodes. (The method will handle if they're misplaced or already present)

            // Transform the focused one
            let focused_node = this.transform_particle_to_local(focused_nodes['focused'][0].record_id, 'focused');
            console.log("focused created:", focused_node)
            // Transform the neighbours
            let neigbours_counter = 0;
            focused_nodes['neighbours'].forEach(node => {
                this.transform_particle_to_local(node.record_id, 'neighbours');
                neigbours_counter++;
            })
            console.log("neighbours created:", neigbours_counter)
            // Transform the secondary
            let secondary_counter = 0;
            focused_nodes['secondary'].forEach(node => {
                this.transform_particle_to_local(node.record_id, 'secondary');
                secondary_counter++;
            })
            console.log("secondary created:", secondary_counter)
            
            console.log("New local network created around", get_single_node_anywhere(focused_nodes['focused'][0].record_id).get_label(), "with", this.local_particles.length, "particles");


            // nasty fix for focused particle
            this.local_particles[0].userData.place_in_stage = "focused";

            // Resolve
            resolve("done with local network");
            
        })

    }


    transform_particle_to_local(record_id, place_in_stage){
        
        // Checking the input of the method...

        if(place_in_stage == undefined){
            console.log("place in stage not defined, return!");
            return;
        }
        if(record_id == undefined){
            console.log("record id not defined, return!");
            return;
        }



        const transform_particle = (record_id, place_in_stage, free_particle) => {

            // Get a random free particle
            let new_particle = free_particle;

            // change the particle's state to local
            new_particle.state.unlock_state();
            new_particle.set_state("local");

            
            //asign the particle's db node
            let db_node = get_single_node_anywhere(record_id);
            new_particle.userData.db_node = db_node;

            // set the label
            new_particle.label = db_node.get_label();
            // new_particle.text_label.first_row = db_node.get_label();

            // set the particle's place in stage
            new_particle.userData.place_in_stage = place_in_stage;

            // set agent state to free
            new_particle.state.agent_state = "free";
            // console.log("new particle:", new_particle);

            // Reference the particle in local_particles
            
            this.local_particles.push(new_particle);
            

            return new_particle;
            
        }

        // If there's a particle present with the input record id, return that particle.
        if(this.is_particle_present(record_id).is_present){
            
            this.move_particle_if_misplaced(record_id, place_in_stage);
            console.log("particle already present, do not trasnform, return!");
            return;

        } else {

            // If there's no particle present, transform a free particle into a local particle
            let free_particle = this.get_random_free_particle();
            let new_particle = transform_particle(record_id, place_in_stage, free_particle);

            return new_particle;
            //
        }

    }

    is_particle_present(record_id){
       
        let return_particle = null;

        // Join all the staged particles into one array
        let all_staged_particles = this.local_particles;

        let is_present = false;
        
        // console.log("all present particles:", all_staged_particles)
        // Check if the particle is present
        //Filter all staged particles by the record id
        let filtered_particles = all_staged_particles.filter(particle => particle.userData.db_node.record_id == record_id);

        if(filtered_particles.length > 0){is_present = true; return_particle = filtered_particles[0];}

        const answer_message = is_present ? "is present" : "is not present";
        // console.log("Is Particle Present?:", record_id, answer_message);

        return {'is_present': is_present, 'particle': return_particle};
        
    }

    

    move_particle_if_misplaced(record_id, correct_place_in_stage) {

        // console.log("checking if particle is misplaced...");
        // Check if the particle is present in the staged particles
        let check_if_present = this.is_particle_present(record_id).is_present;

        if (check_if_present == false) {
            // console.log("particle is not present, return!");
            return;
        }

        // Particle is present
        else{
            // If the particle is present
            // console.log("particle is present, checking if it is misplaced...");
            // define the particle
            let particle = this.is_particle_present(record_id).particle;

            // Check if the particle is misplaced
            let is_misplaced = particle.userData.place_in_stage != correct_place_in_stage;
            
            if(is_misplaced == false){
                // console.log("particle is not misplaced, return!");
                return;
            } 
            else{
                // Set the correct place in the particles userData
                particle.userData.place_in_stage = correct_place_in_stage;

            }

            // Move the particle to the right place

        }
    }

    get_random_free_particle(){
        
        let free_particles = this.context.viz_particles.filter(particle => particle.state.get_label() == "free");
        let random_particle = free_particles[parseInt(random(free_particles.length))];
        //console.log("got random particle", random_particle);
        return random_particle;

    }

    // Returns an boject focusing in a specific node, with its neighbours and secondary neighbours
    focus_on_db_node(record_id){

        // Get the node
        let selected_node = get_single_node_anywhere(record_id);
       

        // Set the return object
        let staged_nodes = {'focused': [], 'neighbours': [], 'secondary': []};
        
        // Remove the selected node from the neighbours and secondary
        staged_nodes.neighbours = staged_nodes.neighbours.filter(item => item != selected_node);
        staged_nodes.secondary = staged_nodes.secondary.filter(item => item != selected_node);

        // Put the node in focus
        staged_nodes.focused.push(selected_node);

        console.log("selected node:", selected_node)
        // Focused node's neigbours
        staged_nodes.neighbours = selected_node.get_neighbours();

        // Empty the secondary neighbours
        staged_nodes.secondary = [];

        // Get Neighbours' neigbours
        for(let i = 0; i < staged_nodes.neighbours.length; i++){

            staged_nodes.neighbours[i].get_neighbours().forEach(element => {
                
                // If the element is not in the secondary neighbours, push it
                if(!staged_nodes.secondary.includes(element)){

                    staged_nodes.secondary.push(element);
                }
            });
        }
        
        if(debug){
            console.log("Focused on node: ", staged_nodes.focused[0].semantic_id, " with ", staged_nodes.neighbours.length, " neigbours and ", staged_nodes.secondary.length, " secondary neigbours");
        }

        return staged_nodes;

    }

    // This needs to be changed.
    // It works, but only for the transition between free and local stage stage.
    // to be excecuted in the constructor.
    // build_local_particle_network(record_id){
        
    //     // Random particles to be assigned as part of the local network
    //     let selected_particles = [];

    //     // Focus on a node, get its neighbours and secondary, populate the staged nodes
    //     this.context.focus_on_node(record_id);

    //     // Get the number of nodes needed to build the network
    //     let number_of_particles_for_local_network = this.context.staged_nodes['neighbours'].length + this.context.staged_nodes['secondary'].length + 1;

    //     // Get the particle in the quadtree more nearest to the center
    //     let search_radius = 100;
    //     let center = new Circle(innerWidth/2, innerHeight/2, search_radius);
    //     let center_particles = this.context.quadtree.query(center);

    //     // Asign a center particle to the selected particles
    //     selected_particles.push(center_particles[0].userData);

    //     // In the next iteraion we can use zones of exclusion for selecting the rest of the nodes.
    //     // for now, just pick random nodes
    //     while (selected_particles.length < number_of_particles_for_local_network){

    //         // Pick a random index
    //         let random_index = parseInt(random(this.context.viz_particles.length));
    //         // If the particle is not already present in the selected particles, push it.
    //         if(selected_particles.indexOf(this.context.viz_particles[random_index]) === -1){
    //             selected_particles.push(this.context.viz_particles[random_index]);
    //         }
    //     }

    //     // In a variable, Filter all the viz particles that are not in the selected particles
    //     let excluded_particles = this.context.viz_particles.filter(particle => selected_particles.indexOf(particle) === -1);

    //     // Lock the state of the excluded particles
    //     excluded_particles.forEach(particle => particle.state.lock_state());

    //     console.log("Local network built, selected_particles: " + selected_particles.length);

    //     // change the state of the selected particles
    //     selected_particles.forEach(particle => particle.set_state('local'));

    //     // TODO: This should be a separate method
    //     // Asign the db nodes to the selected particles
    //     // Asign the focus particle
    //     selected_particles[0].userData.db_node = this.context.staged_nodes['focused'];
    //     // tag the particle
    //     selected_particles[0].userData.place_in_stage = "focused";
    //     // reference the particle in the state's array
    //     this.local_network_particles.push(selected_particles[0]);


    //     // Asign the neighbours
    //     for(let i = 0; i < this.context.staged_nodes['neighbours'].length; i++){
    //         selected_particles[i+1].userData.db_node = this.context.staged_nodes['neighbours'][i];
    //         // tag
    //         selected_particles[i+1].userData.place_in_stage = "neighbours";
    //         this.local_network_particles.push(selected_particles[i+1]);
    //     }
    //     // Asign the secondary neighbours
    //     for(let i = 0; i < this.context.staged_nodes['secondary'].length; i++){
    //         selected_particles[i+1+this.context.staged_nodes['neighbours'].length].userData.db_node = this.context.staged_nodes['secondary'][i];
    //         // tag
    //         selected_particles[i+1+this.context.staged_nodes['neighbours'].length].userData.place_in_stage = "secondary";
    //         this.local_network_particles.push(selected_particles[i+1+this.context.staged_nodes['neighbours'].length]);
    //     }

    //     // Asign a label to the selected particles from the db node
    //     selected_particles.forEach(particle => particle.label = particle.userData.db_node.get_label());
    //     selected_particles[0].color = [255,0,0];
        
    //     // set local targets for the selected particles
    //     //selected_particles.forEach(particle => this.set_particle_initial_target(particle));

    //     // set focused particle flag to move
    //     selected_particles[0].state.agent_state = 'free';

        
    // }

    // This methos is meant to be called from the interaction to one neighbor particle in the local state, to rearrange the local network with focus on the selected particle.
    
    // change_particle_focus(selected_particle){

    //     // Subfunction declaration
    //     const get_random_free_particle = () => {
    //         let free_particles = this.context.viz_particles.filter(particle => particle.state.get_label() == "free");
    //         let random_particle = free_particles[parseInt(random(free_particles.length))];
    //         //console.log("got random particle", random_particle);
    //         return random_particle;
    //     }

    //     const assign_particles = (db_node, place_in_stage, get_random_free_particle) => {

    //         // Get a random free particle
    //         let new_particle = get_random_free_particle();

    //         // change the particle's state to local
    //         new_particle.state.unlock_state();
    //         new_particle.set_state("local");

    //         //asign the particle's db node
    //         new_particle.userData.db_node = db_node;

    //         // set the label
    //         new_particle.label = db_node.get_label();

    //         // set the particle's place in stage to focused
    //         new_particle.userData.place_in_stage = place_in_stage;

    //         // set agent state to free
    //         new_particle.state.agent_state = "free";

    //         return new_particle;
    
    //     }

    //     console.log("Changing focus on particle: ", selected_particle.userData.db_node.get_label());
        
    //     // 1. Focus the db nodes on the selected particle
    //     this.context.focus_on_node(selected_particle.userData.db_node.record_id);

    //     // Initialize asnswer arrray
    //       this.refocus_particle_answer = {
    //         'freed' : [],
    //         'moved' : [],
    //     };
        

    //     // 2. For all the staged particles, send a message to refocus. This will change position or delete depending on the new data on staged nodes.
    //     for(let i = 0; i < this.local_network_particles.length; i++){
    //         this.local_network_particles[i].state.refocus();
    //     }

    //     // Debug
    //     console.log(this.refocus_particle_answer);
    //     console.log("freed: " + this.refocus_particle_answer['freed'].length);
    //     console.log("moved: " + this.refocus_particle_answer['moved'].length);
    //     console.log(this.refocus_particle_answer);

    //     // 3. Identify the remaining particles that need to be built.
    //     // remaining particles = stages nodes - moved particles
    //     let remaining_particles = {
    //         'neighbours' : [],
    //         'secondary' : [],
    //     };

    //     // Get the Moved particles record ids
    //     let moved_particles_record_ids = this.refocus_particle_answer['moved'].map(element => element.particle.userData.db_node.record_id);

    //     // Search the staged nodes for the remaining particles
    //     // Search neighbours
    //     // For all neighbours, check if are particles whose record id is not in the moved_particles_record_ids
    //     remaining_particles.neighbours = this.context.staged_nodes['neighbours'].filter(element => {
    //         if(moved_particles_record_ids.indexOf(element.record_id) == -1){
    //             return true;
    //         } else {
    //             return false;
    //         }
    //     })

        

    //     // Search secondary and add it to the remaining_particles
    //     // returns db nodes
    //     remaining_particles.secondary = this.context.staged_nodes['secondary'].filter(element => {
    //         if(moved_particles_record_ids.indexOf(element.record_id) == -1){
    //             return true;
    //         } else {
    //             return false;
    //         }
    //     });

    //     console.log("remaining_particles: ",remaining_particles);

    //     // 4. Transform the remaining particles
    //     let new_particles = [];
    //     remaining_particles.neighbours.forEach(element => {
    //         new_particles.push(assign_particles(element, "neighbours", get_random_free_particle));
    //     })
    //     remaining_particles.secondary.forEach(element => {
    //         new_particles.push(assign_particles(element, "secondary", get_random_free_particle));
    //     })

    //     // 5. Free the old particles
    //     this.refocus_particle_answer['freed'].forEach(element => {
    //         element.particle.state.unlock_state();
    //         element.particle.set_state("free");
    //     })


    // }
    
    // //DEPRECATED!
    // old_change_particle_focus(selected_particle){

    //     //
    //     console.log("Changing focus on particle: ", selected_particle.userData.db_node.get_label());

    //     // Get the place in stage of the selected particle
    //     let sp_place_in_stage = selected_particle.userData.place_in_stage;

    //     // If the selected particle is focused, return
    //     if(sp_place_in_stage == "focused"){return;}
        
    //     // Store the old staged particles
    //     let old_staged_particles = this.local_network_particles;

    //     // Focus on node based on the selected particle
    //     let node = selected_particle.userData.db_node;
    //     this.context.focus_on_node(node.record_id);

       

    //     // For each particle in the old staged particles, check if they are in the new staged nodes. If so, push them to particles_to_keep.
    //     let particles_to_keep = [];
    //     for(let i = 0; i < old_staged_particles.length; i++){
            
    //         let particle_node_record_id = old_staged_particles[i].userData.db_node.record_id;
    //         let new_staged_nodes = this.context.staged_nodes;

    //         // Check if the particle is the focused particle. If so, push it to particles_to_keep.
    //         if(particle_node_record_id == new_staged_nodes['focused'].record_id){ particles_to_keep.push(old_staged_particles[i]); continue; }

    //         // Check if the particle is in the neighbours. If so, push it to particles_to_keep.
    //         for(let j = 0; j < new_staged_nodes['neighbours'].length; j++){
    //             if(particle_node_record_id == new_staged_nodes['neighbours'][j].record_id){ particles_to_keep.push(old_staged_particles[i]); continue; }
    //         }

    //         // Check if the particle is in the secondary. If so, push it to particles_to_keep.
    //         for(let k = 0; k < new_staged_nodes['secondary'].length; k++){
    //             if(particle_node_record_id == new_staged_nodes['secondary'][k].record_id){ particles_to_keep.push(old_staged_particles[i]); continue; }
    //         }
    //     }
    //     console.log("particles to keep: ", particles_to_keep)

    //     // for the particles that are not in the new staged nodes, change their state to free
    //     let freed_particles = [];
    //     for(let i = 0; i < old_staged_particles.length; i++){
    //         if(!particles_to_keep.includes(old_staged_particles[i])){ 
    //             old_staged_particles[i].state.unlock_state(); 
    //             old_staged_particles[i].set_state("free");
    //             freed_particles.push(old_staged_particles[i]);
    //             }
    //     }

    //     console.log("particles set state to free: ", freed_particles)


    //     // Define a subfunction to get a random free particle
    //     const get_random_free_particle = () => {
    //         let free_particles = this.context.viz_particles.filter(particle => particle.state.get_label() == "free");
    //         let random_particle = free_particles[parseInt(random(free_particles.length))];
    //         //console.log("got random particle", random_particle);
    //         return random_particle;
    //     }

    // // 3. Assing particles

    //     let newly_transformed_particles = []; 
        

    //     // Define a function to asign particles
    //     const assign_particles = (db_node, place_in_stage, particles_to_keep, newly_transformed_particles, get_random_free_particle) => {

    //         // Move the particle to the newly transformed particles
    //         newly_transformed_particles.push(get_random_free_particle());

    //         // Define the last item of the newly transformed particles
    //         let new_particle = newly_transformed_particles[newly_transformed_particles.length-1];

    //         // change the particle's state to local
    //         new_particle.state.unlock_state();
    //         new_particle.set_state("local");

    //         //asign the particle's db node
    //         new_particle.userData.db_node = db_node;

    //         // set the label
    //         new_particle.label = db_node.get_label();

    //         // set the particle's place in stage to focused
    //         new_particle.userData.place_in_stage = place_in_stage;

    //         // set agent state to free
    //         new_particle.state.agent_state = "free";
    
    //     }

    // // 3.1 Asign the focused particle
        
    //     // Does any of the particles to keep have a dbnode record id of the focused particle?
    //     let is_focused_particle_already_in_keep = particles_to_keep.some(particle => particle.userData.db_node.record_id == this.context.staged_nodes['focused'].record_id); 

    //     // If so, Push the first empty particle to be transformed to the newly transformed particles, then remove that particle from the empty_particles_to_be_transformed. And transform it to local state
    //     if(!is_focused_particle_already_in_keep){
            
    //         // Assign the focused particle
    //         assign_particles(this.context.staged_nodes['focused'], "focused", particles_to_keep, newly_transformed_particles, get_random_free_particle);
    
    //     }

    //     // 3.2 Asign the neighbours

    //     // For all the neigbours of the staged nodes
    //     this.context.staged_nodes['neighbours'].forEach(node => {

    //         // Is this neighbour node already present in the particles to keep?
    //         let neighbour_already_in_keep = particles_to_keep.some(particle => particle.userData.db_node.record_id == node.record_id);

    //         // If not, push the first empty particle to be transformed to the newly transformed particles, then remove that particle from the empty_particles_to_be_transformed. And transform it to local state.
    //         if(!neighbour_already_in_keep){

    //             // Asign the neighbor
    //             assign_particles(node, "neighbours", particles_to_keep, newly_transformed_particles, get_random_free_particle);

    //         }
    //     })

    //     // 3.3 Asign the secondary

    //     // For all the neigbours of the staged nodes
    //     this.context.staged_nodes['secondary'].forEach(node => {

    //         // Is this neighbour node already present in the particles to keep?
    //         let secondary_already_in_keep = particles_to_keep.some(particle => particle.userData.db_node.record_id == node.record_id);

    //         // If not, push the first empty particle to be transformed to the newly transformed particles, then remove that particle from the empty_particles_to_be_transformed. And transform it to local state.
    //         if(!secondary_already_in_keep){

    //             // Asign the secondary
    //             assign_particles(node, "secondary", particles_to_keep, newly_transformed_particles, get_random_free_particle);
    //         }
    //     })

    //     console.log("newly transformed particles: ", newly_transformed_particles)

    //     // Add the newly transformed particles and the particles to keep to redefine the local network
    //     this.context.local_network_particles = newly_transformed_particles.concat(particles_to_keep);

    //     // filter all the viz particles that are not present in the local network particles
    //     let particles_to_set_free = this.context.viz_particles.filter(particle => this.context.local_network_particles.indexOf(particle) !== -1);
    //     particles_to_set_free.forEach(particle => particle.set_state("free"));

    //     // 5. Reset the targets
    //     this.context.local_network_particles.forEach(particle => particle.state.target_set = false);

    

    // }

    // Set the arrive target for an individual particle, depending on its state and db node.
    // set_particle_initial_target(selected_particle){

    //     // If the particle doesn't have a db node, return
    //     if(!selected_particle.userData.db_node && selected_particle.state.get_label() != "local"){return;}

    //     // Set the target based on the place in stage flag
    //     switch(selected_particle.userData.place_in_stage){
    //         case "focused":
    //             // center
    //             selected_particle.userData.initial_target = createVector(innerWidth/2, innerHeight/2);
    //             break;
    //         case "neighbours":
    //             // Filter the viz particle with userData.place_in_stage == "focused"
    //             let focused_particle = this.context.viz_particles.filter(particle => particle.userData.place_in_stage == "focused")[0];

    //             // Set the target
    //             //selected_particle.userData.initial_target = focused_particle.pos;
    //             focused_particle.state.ask_for_target(selected_particle);
    //             break;

    //         case "secondary":

    //             // For the secondary, the target may change on the amount of present neighbours. If there's one present neighbor, the target will be the neighbor. If there's more than one present neighbor, it sould calculate the middle point between the neighbours.
                
    //             // Get the present neighbours
    //             let present_neighbours = this.get_present_neighbours(selected_particle);

    //             present_neighbours[0].state.ask_for_target(selected_particle);

    //             // If there's only one present neighbor, set the target to the neighbor
    //             // if(present_neighbours.length == 1){
    //             //     //selected_particle.userData.initial_target = present_neighbours[0].pos;
    //             // } else {

    //             //     // If there's more than one present neighbor, set the target to the middle point between the neighbours
    //             //     let sum_x = 0, sum_y = 0;
    //             //     present_neighbours.forEach(particle => {
    //             //         sum_x += particle.pos.x;
    //             //         sum_y += particle.pos.y;

    //             //     })
    //             //     let middle_point = createVector(sum_x/present_neighbours.length, sum_y/present_neighbours.length);
    //             //     selected_particle.userData.initial_target = middle_point;
    //             // }

    //             break;
    //     }


 
    // }
    
    get_present_neighbours(particle){
        
        // Array with the present neighbours to return
        let present_neighbours = [];	

        // Do the particle has a db node?
        if(!particle.userData.db_node){console.log("no db node");return [];}

        // Get the neighbours of the dbnode
        let db_node_neighbours = particle.userData.db_node.get_neighbours();

        // Push to the present neighbours array all the present neigbours in the stage

        // filter the focused particle
        let focused_particle = this.context.viz_particles.filter(particle => particle.userData.place_in_stage == "focused")[0];
        // Is the focused particle's db node in the neighbours of the db node?
        if(db_node_neighbours.includes(focused_particle.userData.db_node)){
            present_neighbours.push(focused_particle);
        }

        // filter the neighbours
        let neigbours = this.context.viz_particles.filter(particle => particle.userData.place_in_stage == "neighbours");
        // Is the focused particle's db node in the neighbours of the db node?
        neigbours.forEach(particle => {
            if(db_node_neighbours.includes(particle.userData.db_node)){
                present_neighbours.push(particle);
            }
        })

        // filter the secondary
        let secondary = this.context.viz_particles.filter(particle => particle.userData.place_in_stage == "secondary");
        // Is the focused particle's db node in the neighbours of the db node?
        secondary.forEach(particle => {
            if(db_node_neighbours.includes(particle.userData.db_node)){
                present_neighbours.push(particle);
            }
        })

        // Return the present neighbours
        return present_neighbours;

    }

    get_present_neighbours_for_secondary(particle){
        let present_neighbours = [];
        let db_node_neighbours = particle.userData.db_node.get_neighbours();
        // From the local network, filter the neighbours and secondary
        let possible_particles = this.local_particles.filter(particle => particle.userData.place_in_stage == "neighbours" || particle.userData.place_in_stage == "secondary");
        // If the db node is in the possible particles, add it to the present neighbours
        possible_particles.forEach(particle => {
            if(db_node_neighbours.includes(particle.userData.db_node)){
                present_neighbours.push(particle);
            }
        })
        return present_neighbours;
    }

    // Method called by particles to tell stage they're ready for the next particle.
    // ready_for_next_particle(previous_particle){
    //     console.log("ready for next particle")

    //     // Look for the index of the previous particle in this.local_network_particles
    //     let index = this.local_network_particles.indexOf(previous_particle);

    //     // If it's the last particle, return
    //     if(index == this.local_network_particles.length - 1){
    //         return;
    //     } else {
    //         // If it's not, set the next particle agent state to free
    //         this.local_network_particles[index].state.agent_state = "locked"
    //         this.local_network_particles[index + 1].state.agent_state = "free";

    //     }

    // }


}

class StateStageGlobal extends StageState {

    constructor(context){
        console.log("initiating global state");
        super(context);
        // this.node_target_perception = 120;
        this.node_target_perception = this.set_node_target_perception();
        this.timeline_target_perception = 60;
        
        this.targets = []; // Targets for the global stage
        this.screen_orientation = context.context.get_screen_orientation();
        this.timeline = new TimelineGlobal(this,this.timeline_target_perception); // This creates all the targets for the timeline and adds to the target quadtree
        // Refernces for the filtered db nodes
        this.global_db_nodes = []; // Global db nodes to be rendered
        this.filter_and_push_db_nodes(); // Get the filtered db nodes and references in global db nodes to call particles.
        this.targets_quadtree = new QuadTree(new Rectangle(width/2, height/2, width, height),4);
        this.build_particle_targets();
        //this.build_first_particle_target();
        

        console.log('target quadtree',this.targets_quadtree);
    }
    update() {
        
        this.update_target_quadtree();
        this.update_targets();
        this.call_node_particles();
        
        // simply passes the update function to each viz particle
        // this will change as there will be diferent layers of particles that need to be rendered in a particular order.
        
        // for(let i = 0; i < this.context.viz_particles.length; i++){
        //     this.context.viz_particles[i].update();
        // }

        let free_particles = this.context.viz_particles.filter(particle => particle.state.get_label() == "free");
        let timeline_month_particles = this.context.viz_particles.filter(particle => particle.state.place_in_stage != undefined && particle.state.place_in_stage == "timeline_month");
        let timeline_year_particles = this.context.viz_particles.filter(particle => particle.state.place_in_stage != undefined && particle.state.place_in_stage == "timeline_year");
        let constituent_particles = this.context.viz_particles.filter(particle => particle.state.place_in_stage != undefined && particle.state.place_in_stage == "constituent");

        free_particles.forEach(particle => {
            particle.update();
        })

        constituent_particles.forEach(particle => {
            particle.show_edges();
        })
        timeline_month_particles.forEach(particle => {
            particle.update();
            particle.state.show_ellipse();
        })

        constituent_particles.forEach(particle => {
            particle.update();
            particle.state.show_ellipse();
        })
        timeline_year_particles.forEach(particle => {
            particle.update();
            particle.state.show_ellipse();
        })
        
        // For testing
        this.update_timeline();
        

    }

    // To be called at construction
    set_node_target_perception = () => {
        
        // Node target perception should be a percentage of the longest side of the screen
        let longest_side = Math.max(width, height);
        let perception_proportion = 0.1;
        return parseInt(longest_side * perception_proportion);


    }


    // Transform a random free particle to a global one
    transform_particle = (record_id, target, place_in_stage) => {

        // Get a random free particle
        let free_particles = this.context.viz_particles.filter(particle => particle.state.get_label() == "free");
        let new_particle = free_particles[parseInt(random(free_particles.length))];
        // Get a random free particle
        // let new_particle = free_particle;

        // change the particle's state to local
        new_particle.state.unlock_state();
        new_particle.set_state("global");
        new_particle.state.set_place_in_stage(place_in_stage);

        //asign the particle's db node
        if(record_id != null){
        let db_node = get_single_node_anywhere(record_id);
        new_particle.userData.db_node = db_node;
        // set the label
        new_particle.label = db_node.get_label();
        // new_particle.text_label.first_row = db_node.get_label();

        }

        

        // Set the guest target
        new_particle.state.target.guest = target;
        // Reference the particle in the target
        target.userData.particle = new_particle;

        // set agent state to free
        new_particle.state.agent_state = "free";

        return new_particle;
        
    }
    // To be called during update. If there are db node target without a particle, call a particle and cross reference in the target and the particle, changin its state to global_screen.
    call_node_particles(){

        // Subfunction transform the particle to global
      
        
        // Get the particle targets
        let particle_targets = this.get_particle_targets();
       
        // noLoop()

        // Filter the particle targets that do not have a particle referenced
        let targets_whithout_particles = particle_targets.filter(target => target.particle == null);
       

        // If there are targets without particles, call one particle
        if(targets_whithout_particles.length > 0){

            // Get the first target without a particle
            let target = targets_whithout_particles[0];
           
            let target_db_node_record_id = target.userData.db_node.record_id;


            
            // Transform the particle to global
            let transformed_particle = this.transform_particle(target_db_node_record_id, target, "constituent");

            // Reference the particle in the target
            target.particle = transformed_particle;
            

        } else {
            return;
        }

    }

    build_particle_targets(){

        // get the screen orientation
        let screen_orientation = viz.get_screen_orientation();

        // check if there are baked data for the screen orientation
        let is_baked_data_available = this.check_baked_data(screen_orientation);

        if(is_baked_data_available){
            this.build_node_targets_from_baked_data();
        } else {
            this.build_first_particle_target();
        }
    }

    build_node_targets_from_baked_data(){
        console.log("building node targets from baked data")
        // get the screen orientation
        let screen_orientation = viz.get_screen_orientation();

        let data_length;
        // get the baked data
        let baked_data;
        if(printmode == true && bakedpoints_printmode != null || !undefined){
            baked_data = bakedpoints_printmode;
            data_length = Object.keys(bakedpoints_printmode).length
            
        } else {
            if(screen_orientation == 'horizontal'){
                baked_data = this.context.baked_data.node_targets.horizontal;
                data_length = baked_data.length
            }

            if(screen_orientation == 'vertical'){
                baked_data = this.context.baked_data.node_targets.vertical;
                data_length = baked_data.length
            }
        }

        console.log("baked data length: ", data_length)
            
        // build the node targets
        for(let i = 0; i < data_length; i++){
            this.build_particle_target(get_single_node_anywhere(baked_data[i].db_node_record_id), true, {'posx': baked_data[i].target_pos_x, 'posy': baked_data[i].target_pos_y});
        }
    }

    check_baked_data(screen_orientation){

        if(printmode == true){
            if (bakedpoints_printmode == null || undefined){
                console.log("no baked data available. returning false")
                return false;
            } else {
                return true;
            }
        } 
        else {
            if(screen_orientation == 'horizontal'){
                let is_baked_data = this.context.baked_data.node_targets.horizontal.length > 0
                return is_baked_data;
            }
    
            if(screen_orientation == 'vertical'){
                let is_baked_data = this.context.baked_data.node_targets.vertical.length > 0
                return is_baked_data;
            }
        }
        

    }

    get_particle_targets(){
        return this.targets.filter(target => target.userData.is_node_target == true)
    }

    check_if_more_targets_needed(){
        // Checks if there are more targets needed
        
        // Filter all the particle targets from the targets array
        let node_targets = this.targets.filter(target => target.userData.is_node_target == true);
        let more_target_are_needed = node_targets.length < this.global_db_nodes.length;
        if(!more_target_are_needed){
            console.log("no more targets needed. baking positions")
            this.context.bake_node_target_positions();
        };
        // If the number of node targets is less than the number of db nodes, if so, return true
        return more_target_are_needed;
    }



    build_particle_target(db_node, from_baked_data, aditional_data = {}){

        let node_target;

        if(from_baked_data){

            let user_data = {
                'is_node_target': true,
                'particle': null,
                'db_node': db_node, // here will be the particle
            }
            node_target = new VizTargetGlobal(this, aditional_data['posx'], aditional_data['posy'], this.node_target_perception, user_data);
            // make the node target placement state 'placed'
            node_target.placement_state = 'placed';

        }
        // If is not from baked data, build a random particle target
        else {
            let randomx = random(0, width);
            let randomy = random(0, height);
            let user_data = {
                'is_node_target': true,
                'particle': null,
                'db_node': db_node, // here will be the particle
            }
            node_target = new VizTargetGlobal(this, randomx, randomy, this.node_target_perception, user_data);
            
        }

        this.targets.push(node_target);
    }

    // To be called on constructor. A first particle target will be created and then pushed to the targets array
    build_first_particle_target(){

        this.build_particle_target(this.global_db_nodes[0], false);

    }

    // To be called from a node target when it's ready for the next node target. Calls the next node target
    call_next_node_target(){

        // console.log("call next node target")

        // Check if there are more targets needed
        if(this.check_if_more_targets_needed()){

            let node_targets = this.targets.filter(target => target.userData.is_node_target == true);
            let next_db_node_index = node_targets.length;
            let next_db_node = this.global_db_nodes[next_db_node_index];
            this.build_particle_target(next_db_node);
        }
        
    }

    filter_and_push_db_nodes(){

        // Define localdb
        const localdb = this.context.localdb;

        // # 1. Constituents members sorted by membership nodes

        // From the local db, filter all the constituents that have membership
        const constituents_members = localdb.constituents_nodes.filter(constituent => constituent.membership_nodes.length > 0);
        // Sort the constituents members by membership nodes length
        constituents_members.sort(function(a, b) {
            return b.membership_nodes.length - a.membership_nodes.length
        })

        // Define max engagement by membership
        this.max_engagement_by_membership = constituents_members[0].membership_nodes.length
        console.log("max engagement by membership", this.max_engagement_by_membership)

        // Push the constituents members to the global db nodes
        constituents_members.forEach(constituent => {
            this.global_db_nodes.push(constituent);
        })

        // // # 2. Exhibitions
        // const exhibitions = localdb.exhibition_nodes;
        // exhibitions.forEach(exhibition => {
        //     this.global_db_nodes.push(exhibition);
        // })
    }

    // This method, called at constructor, will build the targets for the timeline
    // Deprecated, I will use the method from the first iterarion, building the targets one by one.
    // build_particle_targets(){


    //     const place_target_spaced_apart = (target_object, tries = 1) => {
    //         // This recursive subfunction takes a target and places it in a random position, then checks if that position is colliding. If colliding, calls itself again with a new position

    //         // Set random position
    //         let x = random(0, innerWidth);
    //         let y = random(0, innerHeight);

    //         // Apply random position to target
    //         target_object.pos.x = x;
    //         target_object.pos.y = y;

    //         // Add the target to the quadtree
    //         this.update_target_quadtree();

    //         // Check if colliding
    //         let colission_results = target_object.check_collision_with_targets();

    //         console.log('colission results', colission_results);

    //         let is_colliding = colission_results.length > 0;

    //         if(is_colliding && tries < 100){
    //             tries++;
    //             console.log("trying again", tries);
    //             place_target_spaced_apart(target_object, tries);}
    //         else{
    //             if(tries == 100){
    //                 console.log('could not place target');
    //             }
    //             return;
    //         }
    //     }
    //     // Build random targets, each for a db node
    //     let random_targets = [];

    //     // EXCECUTION AREA

    //     console.log(this.targets.length, 'number of targets');
    //     //  for(let i = 0; i < 2; i++){
    //     for(let i = 0; i < this.global_db_nodes.length; i++){
    //        // console.log(i)
    //         // Define random position, and data to mark it as node target
    //         let user_data = {
    //             'is_node_target': true,
    //             'particle': null // here will be the particle
    //         }
    //         let target = new VizTargetGlobal(this, 0, 0, this.node_target_perception, user_data);
    //         this.targets.push(target);
    //        // console.log(this.targets.length, 'number of targets');
    //         target.color = 'purple';
    //         place_target_spaced_apart(target);

    //         // Then push it to the targets
            

    //     }
        
    // }

    update_targets(){
        // Update targets
        if(this.targets.length > 0){this.targets.forEach(target => target.update());}
    }

    update_target_quadtree(){
        // Update quadtree
        this.targets_quadtree.clear();
        // For each target create a point and insert it in the quadtree
        if(this.targets.length > 0){
            for(let i = 0; i < this.targets.length; i++){

                let point = new Point(this.targets[i].pos.x, this.targets[i].pos.y, this.targets[i]);

                this.targets_quadtree.insert(point);
            }
            
         }

        // // return the number of point in the quadtree
        // let points_in_quadtree = this.targets_quadtree.query(new Rectangle(innerWidth/2, innerHeight/2, innerWidth, innerHeight));
        // console.log(points_in_quadtree.length, 'points in quadtree');
    }

    // builds the timeline for the global state. Ment to be called from the constructor.


    update_timeline(){
        this.timeline.update();
    }


    get_present_neighbours(particle){
        
        // Array with the present neighbours to return
        let present_neighbours = [];	

        // Do the particle has a db node?
        if(!particle.userData.db_node){console.log("no db node");return [];}

        // Get the neighbours of the dbnode
        let db_node_neighbours = particle.userData.db_node.get_neighbours();

        // Get the present particles with db nodes
        let particles_w_db_nodes = this.context.viz_particles.filter(particle => particle.userData.db_node != null || particle.userData.db_node != undefined);

        particles_w_db_nodes.forEach(particle => {
            
            // Is this particle's db node in the neighbours of the db node?
            if(db_node_neighbours.includes(particle.userData.db_node)){
                present_neighbours.push(particle);
            }
        })

        // Return the present neighbours
        return present_neighbours;

    }


}

// Visualization node
class VizParticle {

    constructor(context){

        // Position, physics.
        this.pos = createVector(random(width), random(height));
        this.vel = createVector(0,0);
        this.acc = createVector(0,0);
        this.mass = 1;
        this.radius = 10;
        this.maxSpeed = 10;
        this.maxForce = 0.4;

        this.perception = 100;

        
        // Appearance
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

        this.selection_state = 'idle' // Idle,selected,dimmed


    }

    update(){
       this.state.update();
    }

    clean_user_data(){
        this.userData = {}
        this.radius = 10
    }

    show_ellipse(){
        
        push();
            noStroke();
            //noFill();
            // console.log(this.state.color)
            fill(this.state.color);
          //  fill(this.color[0], this.color[1], this.color[2]);
            ellipse(this.pos.x, this.pos.y, this.radius*2, this.radius*2)
        pop();
        
    }


  

    // TODO: This needs to be rewritten.
    show_edges(){

        if(this.userData.db_node != null){

                let strokeEdge_weight = 0.5;

                let present_neighbours = this.context.state.get_present_neighbours(this);

                // Calculate the stroke weight based on the connections
                // if(this.state.get_label() == "global"){
                    
                //     strokeEdge_weight = map(this.state.get_engagement_by_membership(), 0, 1, style.g_edge_weight_min, style.g_edge_weight_max);
                // }
                // get the present neighbours
                

                // if there are no neighbours, return
                if(present_neighbours.length == 0){
                    return;
                }
                
                push();

                // for each neighbor, draw a line to it
                present_neighbours.forEach(neighbor => {
                    
                    if(this.selection_state == 'idle'){
                        stroke(hexToColor(colors.edges_idle));
                        
                        strokeWeight(strokeEdge_weight)
                    } else if (this.selection_state == 'selected'){
                        stroke(hexToColor(colors.edges_selected));
                        strokeWeight(strokeEdge_weight)
                    } else if (this.selection_state == 'dimmed'){
                        stroke(hexToColor(colors.edges_dimmed));
                        strokeWeight(strokeEdge_weight)
                    }

                    line(this.pos.x, this.pos.y, neighbor.pos.x, neighbor.pos.y);
                })

                pop();
            }

    }

    set_label(label_string){
        this.label = label_string;
        this.text_label.first_row = label_string;
    }

    set_radius(radius){
        //console.log("setting radius")
        this.radius = radius
    }

    show_label(){

        // this.text_label_object.update();
         if(this.label != null && this.label != "undefined"){
            push();
                textAlign(CENTER, TOP);
                textFont(fontRobotoMedium);
                fill(hexToColor(colors.label_1row_idle));
                textSize(16);
                text(this.label, this.pos.x, this.pos.y+this.radius*1.5);
                
            pop();

           
        }

    }

    show_label_2row() {

        push()
            textFont(fontRoboto);
            fill(hexToColor(colors.label_2row_idle));
            textSize(8);
            text("2 years membership", this.pos.x, this.pos.y + this.radius * 1.5 + 16);

        pop()
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
        // if(this.state != null){this.old_state = this.state;}
        
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
            case 'global':
                this.state = new VizParticleStateGlobal(this);
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

    //Physics methods

    update_physics() {
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.set(0, 0);
    }


    applyForce(force) {
        this.acc.add(force);
    }


    

    arrive(target) {
        // 2nd argument true enables the arrival behavior
        let slow_radius = 100;
        return this.seek(target, true, slow_radius);
    }

    seek(target, arrival = false, slow_radius) {
        let force_to_target = p5.Vector.sub(target, this.pos);
        let desiredSpeed = this.maxSpeed;
        if (arrival) {
          let slowRadius = slow_radius;
          let distance = force_to_target.mag();

          if (distance < slowRadius) {
            desiredSpeed = map(distance, 0, slowRadius, 0, this.maxSpeed);
          }
        }
        force_to_target.setMag(desiredSpeed);
        force_to_target.sub(this.vel);
        force_to_target.limit(this.maxForce);
        return force_to_target;
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

        this.external_perception = this.context.perception+100;
        this.internal_perception  = this.context.perception-20;

        // Agent state
        this.agent_state = 'free' // Can be free, locked or waiting.
        this.agent_collision = []; // References for colliding agents
        this.can_update = true;

        this.target_set = false;

        this.target = {
            'host': [],
            'guest': null
        }


        // Check the place in the stage
    

       // this.set_target(context);
    }

    update() {

        // if(this.can_update){
       

            this.inject_data();

            // Move to target     
            if (this.target.guest != null) {
                // console.log("helpoooodasf", this.context.label)
                let steering = this.context.arrive(this.target.guest.pos);
                this.context.applyForce(steering);
            }

            // If the particle is host for a target, update it
            if (this.target.host.length > 0) {

                // For all the host particles, call update
                for (let host of this.target.host) {
                    host.update();
                }
            }
            this.context.show_edges();

            // update the physics
            this.context.update_physics();

            // Show
            //this.context.show_edges();
            this.context.show_ellipse();

            if (this.show_label) { this.context.show_label(); }

             this.show_agent_debug();

            // Cascade 
            if (this.cascade == true) {
                this.context.ripple_out(10);
                this.context.cascade_state(this.label, 10);
            }
        // }

    }

    get_place_in_stage(){
        return this.context.userData.place_in_stage;
    }

    // Sets the target for the particle to move on. It ouputs a target object referenced in the guest.
    // set_target(host_particle){

    //     // 1. If there are targets present in the particle, clear them
    //     // 1.1 Remove host
    //     this.target.host = [];
    //     //1.2 Remove guest
    //     this.target.guest = null;

    //     // 2. Set the target based on the place in stage flag
    //     //console.log(host_particle.state);
    //     switch(this.context.userData.place_in_stage){
    //         case "focused":
    //             // center
    //             // create a target whose guest and host are the same
    //             this.target.host.push(new VizTarget(this.context,this.context));
    //             break;

    //         case "neighbours":
    //             // Filter the first viz particle with userData.place_in_stage == "focused"
    //             let focused_particle = this.context.context.viz_particles.filter(particle => particle.userData.place_in_stage == "focused")[0];
    //             // Create a target
    //             focused_particle.state.ask_for_target(this.context);
    //             break;

    //         case "secondary":
    //             let present_neighbours = host_particle.context.state.get_present_neighbours(this.context);
    //             if(present_neighbours.length > 0) {present_neighbours[0].state.ask_for_target(this.context)};
    //             break;


    //     }

    //     this.target_set = true;

    // }


    show_agent_debug(){


        // color change
        switch(this.context.userData.place_in_stage){
            case 'focused':
                this.color = colors.local_particles_focused;
                break;
            case 'neighbours':
                this.color = colors.local_particles_neighbours;
                break;
            case 'secondary':
                this.color = colors.local_particles_secondary;
                break;
        }
    }


    arrive(target) {
        // 2nd argument true enables the arrival behavior
        let slow_radius = 600;
        return this.seek(target, true, slow_radius);
    }

    seek(target, arrival = false, slow_radius) {
        let force_to_target = p5.Vector.sub(target, this.context.pos);
        let desiredSpeed = this.context.maxSpeed;
        if (arrival) {
          let slowRadius = slow_radius;
          let distance;

            // If there are colliding agents, distance is the middlepoint of those agents
            if(this.agent_collision.length > 0){
                distance = p5.Vector.sub(this.agent_collision[0].userData.pos, this.context.pos).mag();
                //this.context.label = distance;
               // this.set_color([255,0,0]);
            }
            else {
                distance = force_to_target.mag();
            }
          
          
          
          if (distance < slowRadius) {
            //desiredSpeed = map(distance, 0, slowRadius, 0, this.context.maxSpeed);
            this.context.maxSpeed = this.context.maxSpeed - this.context.maxSpeed/6;
          }

        }
        force_to_target.setMag(desiredSpeed);
        force_to_target.sub(this.context.vel);
        force_to_target.limit(this.context.maxForce);
        return force_to_target;
      }

    // calculate_collision_middlepoint(){
    //     if(this.agent_collision.length > 0){

    //         let pos_array = this.agent_collision;
    //         let totalPuntos = pos_array.length;
            
    //         if (totalPuntos === 0) {
    //         // Manejo de caso especial si no hay puntos
    //         return null;
    //         }
        
    //         // Inicializar sumas
    //         var sumaX = 0;
    //         var sumaY = 0;
        
    //         // Sumar las coordenadas de todos los puntos
    //         for (var i = 0; i < totalPuntos; i++) {
    //         sumaX += pos_array[i].userData.pos.x;
    //         sumaY += pos_array[i].userData.pos.y;
    //         }
        
    //         // Calcular el punto medio
    //         var puntoMedioX = sumaX / totalPuntos;
    //         var puntoMedioY = sumaY / totalPuntos;
        
    //         //return { x: puntoMedioX, y: puntoMedioY };
    //         return createVector(puntoMedioX,puntoMedioY);
    // }}


    inject_data(){

        switch(this.context.userData.place_in_stage){
            case "focused":
                this.context.set_radius(12);
                this.show_label = true;
                break;
            case "neighbours":
                this.context.set_radius(8);
                this.show_label = true;
                break;
            case "secondary":
                this.context.set_radius(4);
                this.show_label = false;
                break;
        }
    }

    // to be called from stage state local when there is a change in the stages nodes
    // refocus(){
        
    //     // Subfunction definition
    //     const evauluate_on_new_scenario = () => {
    //         let particle_record_id = this.context.userData.db_node.record_id;
    //         let staged_nodes = this.context.context.staged_nodes;
    //         let found_place = null;

    //         // Is particle db node on the focused node?
    //         let is_focused = particle_record_id == staged_nodes.focused.record_id;
    //         if(is_focused){
    //             found_place = "focused"; 
    //             console.log("FOCUSED IS", this.context);
            
    //         } else if (found_place == null){ 

    //             // Is particle db node on the neigbours? some
    //             staged_nodes.neighbours.forEach(element => {
    //                 if(particle_record_id == element.record_id){
    //                     found_place = "neighbours";
    //                 }
    //             })
    //         } else if (found_place == null){
    //             // Is particle db node on the secondary? some
    //             staged_nodes.secondary.forEach(element => {
    //                 if(particle_record_id == element.record_id){
    //                     found_place = "secondary";
    //                 }
    //             })
    //         }
 

    //         // If wasn't found anywhere, return "freed"
    //         if(found_place == null){
    //             return "freed";
    //         } else {
    //             return found_place;
    //         }
        
    //     }
    //     const asnswer_stage = (new_position) => {
    //         let array_to_answer = this.context.context.state.refocus_particle_answer;
    //         if (new_position == "focused" || new_position == "neighbours" || new_position == "secondary") {
    //             array_to_answer['moved'].push({ 'particle': this.context, 'new_position': new_position });
    //         } else if (new_position == "freed") {
    //             array_to_answer['freed'].push(this.context);
    //         }
    //     }
 
    //     // 1. Evaluate position on stage
    //     let new_position_in_stage = evauluate_on_new_scenario();
    //     // Set position on stage on the userData
    //     this.context.userData.place_in_stage = new_position_in_stage;
    //     console.log("new position in stage for ", this.context.label, new_position_in_stage);
        
    //     // 2. Answer to stage
    //     asnswer_stage(new_position_in_stage);

    // }



}

class VizParticleStateFree extends VizParticleState {
    constructor(context){
        super(context);
        this.color = colors.free_particles_01;
        this.set_label("free");
        this.variation = 10;
        this.context.clean_user_data();
    }



    

    update(){
       // console.log("calling update from free state");

        // update color
        this.color = colors.free_particles_01;

        this.context.random_walk();
        this.context.show_ellipse();
        // if(this.cascade == true){
        //     this.context.ripple_out(10);
        //     this.context.cascade_state(this.label, 10);}
    }
}


// TODO For now, it's a copy of VizParticleStateLocal
class VizParticleStateGlobal extends VizParticleState {

    constructor(context){
        super(context);
        
        this.set_label("global");
        this.variation = 0;

        this.external_perception = this.context.perception+100;
        this.internal_perception  = this.context.perception-20;

        // Agent state
        this.agent_state = 'free' // Can be free, locked or waiting.
        this.agent_collision = []; // References for colliding agents
        this.can_update = true;

        this.target_set = false;

        this.target = {
            'host': [],
            'guest': null
        }
        this.place_in_stage = null;
        this.color = color(0, 0, 0);
        

        // Check the place in the stage
    

       // this.set_target(context);
    }

    update() {
            this.context.selection_state = 'idle'

            // console.log("starting update in particle", this.context.label, "with place in stage", this.place_in_stage)

            // Move to target     
            if (this.target.guest != null) {
                // console.log("helpoooodasf", this.context.label)
                let steering = this.context.arrive(this.target.guest.pos);
                this.context.applyForce(steering);
            }

            // If the particle is host for a target, update it
            if (this.target.host.length > 0) {
                // For all the host particles, call update
                for (let host of this.target.host) {
                    host.update();
                }
            }
            this.context.update_physics();

            this.calculate_color();
            // this.context.show_edges();
            // this.show_ellipse();
            this.show_label();
            // this.show_agent_debug();

            // Cascade 
            if (this.cascade == true) {
                this.context.ripple_out(10);
                this.context.cascade_state(this.label, 10);
            }
        // }

        // console.log("particle", this.context.label, "updated")
    }

    show_label(){

        // console.log("showing label", this.place_in_stage)
        // Switch on place in stage
        switch(this.place_in_stage){
            case "constituent":
                push();
                textFont(fontRobotoMedium);
                textSize(style.timeline_label_font_size);
                translate(this.context.pos.x, this.context.pos.y);
                rotate(style.timeline_label_rotation * Math.PI / 180);
                fill(hexToColor(colors.label_1row_idle));
                text(this.context.userData.db_node.get_label(),this.context.radius+3, 2);
                pop();
                break;
            case "timeline_year":
                let textstring = this.context.userData.db_node.get_year();
                push()
                textFont(fontRobotoMedium);
                textSize(style.timeline_year_font_size);
                fill(hexToColor(colors.global_timeline_year_low));
                text(textstring, this.context.pos.x+this.context.radius, this.context.pos.y + 20);
                pop()
                break;
        }

    }

    show_ellipse(){
        
        switch(this.place_in_stage){
            case "constituent":
                // Radius based on engagement between limits set by style.
                this.context.radius = map(this.get_engagement_by_membership(), 0, 1, style.g_constituent_radius_min, style.g_constituent_radius_max);
                push()
                noStroke()
                fill(this.color)
                ellipse(this.context.pos.x, this.context.pos.y, this.context.radius*2, this.context.radius*2)    
                pop()
                break;
            case "timeline_year":
                // this.context.radius = style.g_timeline_year_radius;
                this.context.radius = map(this.get_engagement_by_membership(), 0, 1, style.g_timeline_year_min, style.g_timeline_year_max);
                // this.context.show_ellipse()
                push()
                noStroke()
                fill(this.color)
                ellipse(this.context.pos.x, this.context.pos.y, this.context.radius*2, this.context.radius*2)    
                pop()
                break;
            case "timeline_month":
                this.context.radius = style.g_timeline_month_radius;
                // this.context.show_ellipse()
                push()
                noStroke()
                fill(this.color)
                ellipse(this.context.pos.x, this.context.pos.y, this.context.radius*2, this.context.radius*2)    
                pop()
                break;
        }
    }


    set_place_in_stage(place_in_stage){
        this.place_in_stage = place_in_stage
        // console.log("my place in stage is "+this.place_in_stage)
    }


    get_engagement_by_membership(){
        let particle_engagement_by_membership = this.context.context.state.get_present_neighbours(this.context).length;
            
        // console.log(this.context.max_engagement_by_membership)
        let engagement_level = map(particle_engagement_by_membership, 1, this.context.context.state.max_engagement_by_membership, 0, 1)
        
        return engagement_level
    }

    // this imports and process the color of the particle depending on its place in stage
    calculate_color() {


        // subfunction
        const visualize_engagement_color = (color_low, color_high) => {

            // Get the present neighbours of this particle
            let engagement_level = this.get_engagement_by_membership();
            
            
            let color_lerp = lerpColor(color_low, color_high, engagement_level);
            // console.log("color lerp",color_lerp)
            return color_lerp;

        }

        // excecution

        switch (this.place_in_stage) {
            case 'timeline_year':
                // this.color = colors.global_timeline_year_low;
                this.color = visualize_engagement_color(hexToColor(colors.global_timeline_year_low), hexToColor(colors.global_timeline_year_high));
                break;
            case 'timeline_month':
                this.color = colors.global_timeline_month_idle;
                break;
            case 'constituent':
                // console.log(hexToColor(colors.constituent_low))
                // this.color = 'red'
                // this.color = hexToColor(colors.constituent_low);

                if(this.selection_state == 'selected'){this.color = 'red'} 
                else {
                    this.color = visualize_engagement_color(hexToColor(colors.constituent_low), hexToColor(colors.constituent_high));
                }

                // console.log("calculated color: ",this.color.r, this.color.g, this.color.b)
                break;

        }



    }

    show_agent_debug(){


        // color change
        switch(this.context.userData.place_in_stage){
            case 'focused':
                this.color = [0,0,255];
                break;
            case 'neighbours':
                this.color = [60,60,60];
                break;
            case 'secondary':
                this.color = [255,255,255];
                break;
        }


    }


    arrive(target) {
        // 2nd argument true enables the arrival behavior
        let slow_radius = 600;
        return this.seek(target, true, slow_radius);
    }

    seek(target, arrival = false, slow_radius) {
        let force_to_target = p5.Vector.sub(target, this.context.pos);
        let desiredSpeed = this.context.maxSpeed;
        if (arrival) {
          let slowRadius = slow_radius;
          let distance;

            // If there are colliding agents, distance is the middlepoint of those agents
            if(this.agent_collision.length > 0){
                distance = p5.Vector.sub(this.agent_collision[0].userData.pos, this.context.pos).mag();
                //this.context.label = distance;
               // this.set_color([255,0,0]);
            }
            else {
                distance = force_to_target.mag();
            }
          
          
          
          if (distance < slowRadius) {
            //desiredSpeed = map(distance, 0, slowRadius, 0, this.context.maxSpeed);
            this.context.maxSpeed = this.context.maxSpeed - this.context.maxSpeed/6;
          }

        }
        force_to_target.setMag(desiredSpeed);
        force_to_target.sub(this.context.vel);
        force_to_target.limit(this.context.maxForce);
        return force_to_target;
      }




    inject_data(){

        switch(this.context.userData.place_in_stage){
            case "focused":
                this.context.set_radius(12);
                this.show_label = true;
                break;
            case "neighbours":
                this.context.set_radius(8);
                this.show_label = true;
                break;
            case "secondary":
                this.context.set_radius(4);
                this.show_label = false;
                break;
        }
    }



}

// VizTarget
// viz target are aides and constraints for the composition of particles
class VizTargetLocal{
    constructor(host, guest){

        // Defining the particles
        this.host_particle = host;
        this.guest_particle = guest; // the guest asks fot the target and then receives it with a method.
         
        // Define Host Position

        // If its the same particle, set the position to the center
        if(this.host_particle == this.guest_particle){
            this.host_particle_pos = createVector(width/2, height/2);   
        } else {
            this.host_particle_pos = createVector(this.host_particle.pos.x, this.host_particle.pos.y);
        }
        
        // Random vector
        this.random_vector = this.create_random_point();

        // Pos of the target
        this.pos = p5.Vector.add(this.host_particle_pos, this.random_vector);

        // Reference the target in the guest particle
        //console.log("setting target at", this.guest_particle)
        this.guest_particle.state.target.guest = this;
    
    }

    update(){
        // Updating the target
        if(this.host_particle == this.guest_particle){
        this.pos = this.host_particle_pos} 
        else {
        this.pos = p5.Vector.add(this.host_particle.pos, this.random_vector);
        }

       // this.show_debug();
        
        
    }


    // Creates a random point near to the position
    create_random_point() {
        let random_point = createVector(random(-100,100), random(-100,100));
        if (this.host_particle == this.guest_particle) {
            return random_point;
        }
         

        let separation_magnitude = 100;

        if(this.guest_particle.userData.place_in_stage === "neighbours"){

            separation_magnitude = 300;
        }
        if(this.guest_particle.userData.place_in_stage === "secondary"){
            separation_magnitude = 50;
        }
        random_point.setMag(/*random(100,150)*/separation_magnitude); // this range should be diferent for the different places in stage

        if(this.host_particle.userData.angle_counter == undefined){
            this.host_particle.userData.angle_counter = 1;
        }

        this.host_particle.userData.angle_counter++;
            
            
    
            // Increase the angle counter
            let angle =  this.host_particle.userData.angle_counter;

            // set the number multiply divide by
            let number_to_multiply = 350/this.host_particle.context.state.staged_nodes['neighbours'].length;
            console.log("number to multiply", number_to_multiply)
            //let number_to_multiply = 350/this.host_particle.context.staged_nodes['neighbours'].length;

            random_point.setHeading(radians(angle*number_to_multiply));
             return random_point;
             
        
        
        
    }

    check_if_target_is_well_placed(random_point){

        // Look for the VizTarget objects present in stage.
        let local_network = this.host_particle.context.state.local_network_particles;
        let present_targets = [];

        // For each particle in the local network get the targets
        for (let i = 0; i < local_network.length; i++) {
            if(local_network[i].state.target.host.length > 0){
                for(let j = 0; j < local_network[i].state.target.host.length; j++){
                    present_targets.push(local_network[i].state.target.host[j]);
                }
            }
        }
        let position_candidate = p5.Vector.add(this.host_particle.pos, random_point);
       
        // If there are no targets, return true
        if(present_targets.length === 0){return true;}

        // If this target is too close to another target, return false
        for(let i = 0; i < present_targets.length; i++){
            let distance = p5.Vector.dist(position_candidate, present_targets[i].pos);
            console.log(distance)
            if(distance < 200){
                console.log("too close, try again")
                return false;
                
            } else {
                return true;
            }
        }
return true;

    }

    // make_point_in_radius(startVector, radius) {

    //     // Initialize an angle counter in the host particle
    //     if(this.host_particle.userData.angle_counter == undefined){
    //         this.host_particle.userData.angle_counter = 0;
    //     }
    //     let angle = this.host_particle.userData.angle_counter;

    //     // Increase the angle counter
    //     angle += PI / 6

        
    //     let randomVector = p5.Vector.fromAngle(angle); // Create a random direction vector
    //     randomVector.setMag(radius); // Set the magnitude to the given radius
    //     let newVector = p5.Vector.add(startVector, randomVector); // Add the random vector to the start vector
    //     return newVector;
    //   }

    // show graphical debug iformation
    show_debug(){

        if(debug){

            push()
            fill('pink');
            ellipse(this.pos.x, this.pos.y, 10, 10);
            pop()
        }
        
    }


    }

// Viz Target class to use in the global stage state
// This kind of target lives independently of the particles, it is hosted on the stage state.
class VizTargetGlobal {
    constructor(context, posx, posy, perception, user_data) {
        
        this.context = context; // State stage object where the target is located
        this.stage = this.context.context; // This is not a 
        this.targets = this.context.targets

        this.particle = null; // Reference to the particle hosted by the target.
        
        this.pos = createVector(posx, posy);
        this.vel = createVector(0,0);
        this.acc = createVector(0,0);
        this.color = 'pink';
        this.radius = 10;
        this.maxSpeed = 40;
        this.maxForce = 10;
        this.perception = perception;
        this.userData = user_data;
        // this.timeline_target_point = this.set_timeline_target_point();
        this.colliding_targets = [];

        //  If this is node target
        this.initial_direction = this.set_initial_direction();
        this.acceptable_distance_from_initial_direction = 50;
        this.placement_state = 'moving'
        
    }

    update_physics() {
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.set(0, 0);
    }

    update() {
        // Forces
        if(this.is_node_target()){
            
            if(this.placement_state == 'moving'){
                this.check_collision_with_targets();
                this.wrap_screen();
                this.apply_node_target_forces();
                this.update_physics();
            
            }
            
            this.evaluate_placement_state();
        }
        
        // Update the physics
        
        // Show
        // this.show_debug();

    }

    wrap_screen() {
        if (this.pos.x > width) this.pos.x = 0;
        if (this.pos.x < 0) this.pos.x = width;
        if (this.pos.y > height) this.pos.y = 0;
        if (this.pos.y < 0) this.pos.y = height;
    }

    // this method only checks for the conditions to switch placement state
    evaluate_placement_state() {

        // console.log("evaluate placement state",this.placement_state)

        switch (this.placement_state) {
            case 'moving':
                // evaluate if the target is stopped
                let stopped = this.vel.mag() < 0.1 ? true : false;
                if (stopped) {
                    this.placement_state = 'stopped';
                }
                break;
            case 'stopped':
                // evaluate if the target is well placed
                if(this.is_well_placed()){
                    
                    // console.log("context is" ,this.context)
                    this.context.call_next_node_target();
                    this.placement_state = 'placed'} 
                else {
                    // Try again
                    try_again();
                }
                // If the distance from the ini
                break;
            case 'placed':
                
                break;

        }
        

        const try_again = () => {
            this.pos.x = random(width);
            this.pos.y = random(height);
            this.acceptable_distance_from_initial_direction = this.acceptable_distance_from_initial_direction + 5;
            this.placement_state = 'moving';
        }
    }

    // Set initial direction. To be called on constructor, for node targets, set a point near the years referenced in the timeline.
    set_initial_direction(){

        let db_node = this.userData.db_node

        // Check if this is a node target
        if(this.is_node_target()){

            // It can be an exhibition or a constituent.
            let type_of_dbnode = db_node.node_type;

            if(type_of_dbnode == 'exhibition'){

                // Get the year label from the database
                // console.log(" date_year_record_id",db_node.date_year_record_id)
                let year_db_node = get_single_node_anywhere(db_node.date_year_record_id[0]).get_label().toString();
                // console.log(year_db_node)
                let year_timeline_point = this.context.timeline.get_year_target_point(year_db_node);

                // Return the position of the timeline point
                // console.log(year_timeline_point)
                return year_timeline_point.pos;
                
            } 
            else if(type_of_dbnode == 'constituent'){

                // Get a year array for the constituent membership nodes
                let years_string_array = db_node.get_membership_as_years_array();
                let years_timeline_points = [];
                // For each year, get the timeline point
                years_string_array.forEach(year => {
                    years_timeline_points.push(this.context.timeline.get_year_target_point(year));
                })
                let years_middlepoint = calculate_middlepoint(years_timeline_points);
                return years_middlepoint;
                
            } 
            else {console.log("wrong type of db node"); return;}

        }else {return;}

    }

    check_collision_with_targets(){
    
        // Query the target quadtree in the perception radius
        let radius_circle = new Circle(this.pos.x, this.pos.y, this.perception);
        let quadtree_query = this.context.targets_quadtree.query(radius_circle);
        // Push the particles
        let particle_query_results = [];
        quadtree_query.forEach(item => particle_query_results.push(item.userData));
        // Filter out this particle
        particle_query_results = particle_query_results.filter(particle => particle != this);

        this.colliding_targets = particle_query_results;
        return particle_query_results;

    }

    is_well_placed(){

        // Get the acceptable distance from the initial direction
        let acceptable_distance = this.acceptable_distance_from_initial_direction;
        if (this.pos.dist(this.pos, this.initial_direction) < acceptable_distance) {
            // console.log("target is well placed")
            return true; 
        } else {
            // console.log("target is not well placed")
            return false;}
        
        
    }

    is_node_target() {
        if(this.userData.is_node_target != undefined && this.userData.is_node_target){return true;} else {return false;}
    }


    // set_timeline_target_point(){

    //    // Search in the targets array a random timeline target and reference it
    //    let timeline_targets = this.targets.filter(target => target.is_part_of_timeline());
    //     let random_index = parseInt(random(timeline_targets.length));
    //     return timeline_targets[random_index];
       
    // }

    applyForce(force) {
        this.acc.add(force);
    }

    apply_node_target_forces(){

        let forces = [];

        // Force 1: arrive at distance to the edge timeline target point
        if (this.placement_state == 'moving') {

            // Move to initial direction
            let initial_direction = this.arrive_at_distance(this.initial_direction, this.perception);
            forces.push(initial_direction);

            // Move away from other node targets
            let distance_from_colliding_placed_targets = this.keep_distance_from_targets();
            forces.push(distance_from_colliding_placed_targets);


            forces.forEach(force => this.applyForce(force));
        }

        // Force 2: repel from other node targets
        // for (let i = 0; i < this.colliding_node_targets.length; i++) {
        //     forces.push(this.keep_distance_from_node_target(this.colliding_node_targets[i]));
        // }


        // Apply all forces
        
    }

    keep_distance_from_targets() {
        
        // If are no colliding targets, return 0,0 vector
        if(this.colliding_targets.length == 0){return createVector(0,0);}

        // From the colliding targets, calculate the middlepoint
        let colliding_middlepoint = calculate_middlepoint(this.colliding_targets);

        let force = p5.Vector.sub(this.pos, colliding_middlepoint);
        force.sub(this.vel);
        force.limit(this.maxForce);
        this.maxSpeed = 0;
        return force;
    }


    // Check if the target is part of a timeline. Ment to be excecuted from another object.
    is_part_of_timeline() {
        if(this.userData.timeline != undefined){
            return true;} else 
            {return false;}
    }

    arrive_at_distance(target,distance_from_target) {
        // Inverse of seek
        let force = p5.Vector.sub(this.pos, target);
        let desiredSpeed = this.maxSpeed;
        
          let slowRadius = distance_from_target;
          let distance = force.mag();
          if (distance > slowRadius) {
            desiredSpeed = map(distance, 0, slowRadius, this.maxSpeed, 0);
            
          }
        
        force.setMag(desiredSpeed);
        force.sub(this.vel);
        force.limit(this.maxForce);
        return force;
      }

    show_debug() {

        if(debug){
            push();
                // center
                fill(this.color);
                noStroke();
                ellipse(this.pos.x, this.pos.y, 3, 3);
            pop();
            push();
                // Perception
                stroke(this.color);
                noFill();
                ellipse(this.pos.x, this.pos.y, this.perception, this.perception);
            pop();

            // If this is a timeline target, and is the first month, show the label
            if(this.userData.timeline != undefined && this.userData.timeline.month == 1){
                push()
                    fill(0)
                    text(this.userData.timeline.year, this.pos.x, this.pos.y +20);
                pop()
            }

            if(this.is_node_target()){

                push()
                    fill(0)
                    
                    // let stopped = this.vel.mag() < 0.1 ? true : false


                    text(this.userData.db_node.node_type, this.pos.x, this.pos.y +40);
                    text(this.placement_state, this.pos.x, this.pos.y +60);
                    text(this.colliding_targets.length+" colliding targets", this.pos.x, this.pos.y +80);
                    // initial direction
                    fill('green')
                    ellipse(this.initial_direction.x, this.initial_direction.y, 5, 5);
                pop()
            }

        }
    }
}

class TimelineGlobal{

    // TODO this composition must change regarding the modificatons in screen size. This is a object to render in global view, where maybe we're going to implement grab screen or something that allows to zoom in and out.
    constructor(context, perception) {
        this.context = context; // State stage global
        this.margin_horizontal = 80;
        this.margin_vertical = 80;
        this.curve_tightness = 1;
        this.perception = perception;
        
        this.start_point = createVector(lerp(0,width,0.15),lerp(0,height,0.15));
        
        this.targets = [];
        this.end_point = createVector(width - this.margin_horizontal, height - this.margin_vertical);
        
        this.years_reference = [];
        for (let year = 1995; year <= 2024; year++) {
            this.years_reference = [...this.years_reference, year.toString()];
        }

        
        this.points_amount = (this.years_reference.length*12)-11;
        this.build_timeline();
        this.reference_targets_on_stage();

    }

    update(){
        // Targets are being updated in the state stage.
    }

    // It takes a year string and returns the target point
    get_year_target_point(year){
        return this.targets.find(target => target.userData.timeline.year == year);
    }

    // builds the timeline points in a curve
    build_timeline(){

        // Define subfunctions
        const calculate_curve = (index) => {
            
            // Check if the screen is vertical or horizontal
            // TODO: This should be managed more centrally at some point.
            // let screen_orientation = innerWidth > innerHeight;
            
            let x, y;

            if (viz.get_screen_orientation() == 'horizontal') {
                // Make a horizontal curve
                this.screen_orientation = 'horizontal';
                y = lerp(0, height, map(sin(index / (this.points_amount / 6.5)), 0, 1, 0.5, 0.9));
                x = lerp(0, width, map(index, -30, this.points_amount + 30, 0, 1))
            } else {
                // Make a vertical curve
                this.screen_orientation = 'vertical';
                x = lerp(0, width, map(sin(index / (this.points_amount / 7.5)), 0, 1, 0.5, 0.9));
                y = lerp(0, height, map(index, -30, this.points_amount + 30, 0, 1))
            }


            return {x, y};
        }

        // Excecution
        // 1. Make the targets for each month and year in the timeline.
        let month_counter = 1;
        let year_counter = parseInt(this.years_reference[0]);

        for (let i = 0; i < this.points_amount; i++){

            // Calculate positions to create a sin curve
            let curve = calculate_curve(i);
            let x = curve.x;
            let y = curve.y;
            
                let userData = {
                    'timeline': {
                        'year': year_counter,
                        'month': month_counter,
                    'db_node': null,
                    'particle': null
                    }
                }

                // If the month counter is 1, asociate the membership node of the year
                if(month_counter == 1){

                    // Find in hte local db a memebership node that has the same year as the year counter.
                    localdb.membership_nodes.find(node => {
                        if(node.semantic_id == year_counter+' Member'){
                            userData.db_node = node;
                        }
                    })

                }
                
                let new_target = new VizTargetGlobal(this, x, y, this.perception, userData);
                this.targets.push(new_target);
                month_counter++;
            

            if (month_counter > 12){
                month_counter = 1;
                year_counter++;
            }

       

        }

        // 2. Call particles to render the targets.
        

        // Define the target on january
        let years_timeline_targets = this.targets.filter(target => target.userData.timeline.month == 1)
        // console.log("years_timeline_targets",years_timeline_targets)
        years_timeline_targets.forEach(target => this.context.transform_particle(target.userData.db_node.record_id,target,'timeline_year') );

        // Call a particle on each month
        let month_timeline_targets = this.targets.filter(target => target.userData.timeline.month != 1)
        month_timeline_targets.forEach(target => this.context.transform_particle(null,target, 'timeline_month') );


    }

    // After the timeline targets are built, we need to reference them on the stage
    reference_targets_on_stage() {
        
        if(this.targets.length > 0){
            
            this.targets.forEach(target => this.context.targets.push(target));
            
        }

    }
}

// GENERAL FUNCTIONS


// This function calculates the middle point of an array of points.
function calculate_middlepoint(points_array) {

    // Check if the array is not empty
    if (points_array.length > 0) {

        // Initialize x and y coordinates to 0
        let x = 0;
        let y = 0;

        // Iterate over each point in the array
        for (let i = 0; i < points_array.length; i++) {

            // Add the x and y values of each point to the running totals
            x += points_array[i].pos.x;
            y += points_array[i].pos.y;
        }

        // Calculate the average x and y values by dividing the running totals by the length of the array
        let middle_point = createVector(x / points_array.length, y / points_array.length);

        // Return the middle point as a p5.js vector
        return middle_point;
    }

}


class TextLabel {

    constructor(context, first_row, second_row){

        this.context = context;
        this.font_bold = fontRobotoMedium;
        this.font_regular = fontRoboto;
        this.font_size_first_row = style.font_size_first_row;
        this.font_size_second_row = style.font_size_second_row;
        this.vert_distance_factor = style.vertical_factor;
        this.line_height = style.line_height;
        this.selection_state = 'idle' // Idle,selected,dimmed
        this.text_first_row = first_row;
        this.text_second_row = second_row;
    }

    update() {
        
        // switch(this.selection_state){
        //     case 'idle', 'dimmed':
        //         this.first_row();
        //         break;
        //     case 'selected', 'print':
        //         this.first_row();
        //         this.second_row();
        //         break;
        // }

        if (this.selection_state == 'idle' || this.selection_state == 'dimmed') {
            this.first_row();
        } else if (this.selection_state == 'selected' || this.selection_state == 'print') {
            this.first_row();
            this.second_row();
        }


    }

    first_row(){

        if(this.text_first_row != null){


            let color, font;
            switch(this.selection_state){
                case 'idle':
                    color = colors.label_1row_idle;
                    font = this.font_regular;
                    console.log('idle')
                    break;
                case 'dimmed':
                    color = colors.label_1row_dimmed;
                    font = this.font_regular;
                    break;
                case 'selected':
                    color = colors.label_1row_selected;
                    font = this.font_bold;
                    break;
                case 'print':
                    color = colors.label_1row_print;
                    font = this.font_bold;
                    break;
            }

            console.log(this.text_first_row)
            push();
                fill(color);
                textAlign(CENTER, TOP);
                textFont(font);
                text(this.text_first_row, this.context.pos.x, this.context.pos.y+this.context.radius*this.vert_distance_factor);
                
            pop();
        }

    }

    second_row(){
        
        if(this.text_second_row != null){

            let color, font;
            switch(this.selection_state){
                case 'idle':
                    color = colors.label_2row_idle;
                    font = this.font_regular;
                    break;
                case 'dimmed':
                    color = colors.label_2row_dimmed;
                    font = this.font_regular;
                    break;
                case 'selected':
                    color = colors.label_2row_selected;
                    font = this.font_bold;
                    break;
                case 'print':
                    color = colors.label_2row_print;
                    font = this.font_bold;
                    break;
            }
    
            push();
                fill(color);
                textAlign(CENTER, TOP);
                textFont(font);
                text(this.text_second_row, this.context.pos.x, this.context.pos.y+this.context.radius*this.vert_distance_factor+this.line_height);
            pop();
        
        }
    }

}