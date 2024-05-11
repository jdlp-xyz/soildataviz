class VizInput {
    constructor(stage) {
     
        this.stage = stage;
        this.selected_element = null;
        this.selected_element_label = null;
        this.perception = 20;
        this.dragging = false;

    }

    update() {
        // this.show_debug();
        this.query_elements();
        
        // this.message_selected_particle();
        // this.drag_global_particles();
    }

    query_elements() {

        let stage_state = this.stage.state.get_label();

        switch(stage_state) {
            case "global":
               this.query_global_particles();
                break;
            case "local":
                this.query_local_particles();
                break;
        }
    }

    query_local_particles() {
        this.selected_element = null;
        
        // Focused and neighbours particles
        let selectable_particles = this.stage.state.local_particles.filter(particle => particle.userData.place_in_stage == "focused" || particle.userData.place_in_stage == "neighbours");

        let mouse = createVector(mouseX, mouseY);

        selectable_particles.forEach(particle => {

            let distance = p5.Vector.sub(particle.pos, mouse).mag();

            if (distance < this.perception) {

                this.selected_element = particle;
                this.selected_element_label = this.selected_element.label
            }
        })
    }

    // Looks in the global node target particles and returns the particle that the mouse is over
    query_global_particles() {

        // console.log("this is dragging: ", this.dragging)
        
        // if (this.dragging == false) {
            
            this.selected_element = null;
            // console.log(this.stage.state instanceof StateStageGlobal)
            // First, this only works in global state
            if (this.stage.state instanceof StateStageGlobal) {


                let targets_quadtree = this.stage.state.targets_quadtree;
                let mouse_query = new Circle(mouseX, mouseY, this.perception);
                let colliding_node_targets = targets_quadtree.query(mouse_query);
                colliding_node_targets = colliding_node_targets.filter(target => target.userData.userData.is_node_target);

                if (colliding_node_targets.length > 0) {

                    this.selected_element = colliding_node_targets[0];
                    this.selected_element_label = this.selected_element.userData.userData.db_node.get_label();
                    this.select_particle_inside_target()
                    // console.log(this.selected_element_label, " is ", particle.selection_state);
                    // console.log("selected element: ", particle, " is ", particle.selection_state)
                }



            }
        // }

    }

    // To be called when the mouse is released
    mouseReleased(){
        
        // Get the label of the stage state
        let stage_state = this.stage.state.get_label();
        
        switch(stage_state) {
            case "free":
                this.stage.set_stage_state("global");
                break;
            case "global":
                this.go_to_local_view();
                break;
            case "local":
                this.click_in_local_view();

        }
    }

    click_in_local_view() {
        if (this.selected_element != null) {

            // Get the selected particle db node record id
            let record_id = this.selected_element.userData.db_node.record_id;
            console.log("Click in local view: particle", this.selected_element_label, "record_id: ", record_id);

            // Transform local network
            viz.stage.set_stage_state('free').then(() => viz.stage.set_stage_state('global'));
            // viz.stage.set_stage_state('global');
            // viz.stage.set_stage_to_local(record_id);
            // viz.stage.state.transform_local_network(record_id);
            this.selected_element = null;

        }
        else {
            // viz.stage.set_stage_state('global');
            viz.stage.set_stage_state('free').then(() => viz.stage.set_stage_state('global'));
            // viz.stage.set_stage_state('global');
        }
    }

    // sends a message to the selected element

    select_particle_inside_target(){
        
        if(this.selected_element.userData.userData.particle != null || this.selected_element.userData.userData.particle != undefined) {
            let particle = this.selected_element.userData.userData.particle;
            particle.selection_state = 'selected';

        }
        
    }

    drag_global_particles() {

        if(this.selected_element != null && mouseIsPressed) {
            this.dragging = true;
            let mousepos = createVector(mouseX, mouseY);
            this.select_particle_inside_target();
            this.selected_element.userData.pos = mousepos;
            // this.selected_element.userData.show_debug();

        } else {
            this.dragging = false;
        }
    }

    go_to_local_view() {

        console.log("click to local view")

            if(this.selected_element != null) {
                this.dragging = true;
                let mousepos = createVector(mouseX, mouseY);
                this.select_particle_inside_target();
                let record_id = this.selected_element.userData.userData.db_node.record_id;
                console.log("record_id: ", record_id);

                viz.stage.set_stage_state('free')
                viz.stage.set_stage_to_local(record_id);

                this.selected_element = null;


                
                // this.selected_element.userData.show_debug();
    
            } else {
                console.log("no element selected");
            }
        
    }

    // shows the element that the mouse is over
    show_debug(){
        
        text("selected element: ", mouseX+20, mouseY+10)
        if(this.selected_element != null) {
            text(this.selected_element_label, mouseX+20, mouseY+20)
        } else {
            text("none", mouseX+20, mouseY+20)}

    }

}