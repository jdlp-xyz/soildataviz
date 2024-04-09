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

        // Local network
        this.staged_nodes = {
            'focused': null,
            'neighbours': [],
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
                this.state = new StateStageLocal(this, "reckeeM7EPI7SOsGF") // for testing only
                console.log("changed state to:", this.state);
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
        this.transform_local_network("reckeeM7EPI7SOsGF");
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
            let focused_target = new VizTarget(this.local_particles[0], this.local_particles[0]);
            focused_particle.state.target.host.push(focused_target);
            focused_particle.state.target.guest = focused_target;

            // For each of the neighbours, set target to the focused particle
            // Filter the neibours
            let neigbours = this.local_particles.filter(p => p.userData.place_in_stage == "neighbours");
            for(let i = 0; i < neigbours.length; i++){
                let target = new VizTarget(this.local_particles[0], neigbours[i]);
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
                let target = new VizTarget(particle_first_neighbour, secondary[i]);
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



// Visualization node
class VizParticle {

    constructor(context){

        // Position, physics.
        this.pos = createVector(random(innerWidth), random(innerHeight));
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
            fill(this.state.color[0], this.state.color[1], this.state.color[2]);
          //  fill(this.color[0], this.color[1], this.color[2]);
            ellipse(this.pos.x, this.pos.y, this.radius*2, this.radius*2)
        pop();
        
    }

    // TODO: This needs to be rewritten.
    show_edges(){

        
            // get the present neighbours
            let present_neighbours = this.context.state.get_present_neighbours(this);

            // if there are no neighbours, return
            if(present_neighbours.length == 0){
                return;
            }
            //console.log(present_neighbours)
            push();

            // for each neighbor, draw a line to it
            present_neighbours.forEach(neighbor => {
                stroke(0, 20);
                line(this.pos.x, this.pos.y, neighbor.pos.x, neighbor.pos.y);
            })

            pop();
    }

    set_label(label_string){
        this.label = label_string;
    }

    set_radius(radius){
        //console.log("setting radius")
        this.radius = radius
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
        //show target
        // push();
        //     //rect(this.context.userData.initial_target.x, this.context.userData.initial_target.y, 10, 10);
        // pop();

        // // show agent_perception
        // push()
        //     noFill();
        //     stroke(255);
        //     ellipse(this.context.pos.x, this.context.pos.y, this.external_perception, this.context.external_perception);
        //     stroke(255,0,0);
        //     ellipse(this.context.pos.x, this.context.pos.y, this.internal_perception, this.internal_perception);
        // pop()

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

        // push()
        //     text(this.agent_collision.length, this.context.pos.x, this.context.pos.y+30);
        // pop()
    }

    // check_collisions_with_agents(external_perception = true){
    //     let perception_ring;
    //     if(external_perception == true){
    //         perception_ring = this.external_perception;
    //     }else {
    //         perception_ring = this.internal_perception;}
    //     // Query the quadtree points in that boundary to get all collsion results
    //     let collision = this.context.get_collision(perception_ring, 'circle');
    //     //console.log(collision)
    //     // Filter the particles that are in local state
    //     collision = collision.filter(particle => particle.userData.state.get_label() == 'local');

    //     // Sort the collision results from the nearest to the farthest
    //     collision.sort((a,b) => {
    //         return p5.Vector.dist(this.context.pos, a.userData.pos) - p5.Vector.dist(this.context.pos, b.userData.pos);
    //     })

    //     // Filter the particles whose agent state is locked
    //     //collision = collision.filter(particle => particle.userData.state.agent_state == 'locked');

    //     // Return the results
    //     //console.log("collisions", collision.length)
    //     return collision;

    // }

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
        this.color = [170,170,170];
        this.set_label("free");
        this.variation = 1;
        this.context.clean_user_data();
    }



    

    update(){
       // console.log("calling update from free state");
        this.inject_data();
        this.context.random_walk();
        this.context.show_ellipse();
        // if(this.cascade == true){
        //     this.context.ripple_out(10);
        //     this.context.cascade_state(this.label, 10);}
    }
}

// VizTarget
// viz target are aides and constraints for the composition of particles
class VizTarget{
    constructor(host, guest){

        // Defining the particles
        this.host_particle = host;
        this.guest_particle = guest; // the guest asks fot the target and then receives it with a method.
         
        // Define Host Position

        // If its the same particle, set the position to the center
        if(this.host_particle == this.guest_particle){
            this.host_particle_pos = createVector(innerWidth/2, innerHeight/2);   
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

            separation_magnitude = 200;
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