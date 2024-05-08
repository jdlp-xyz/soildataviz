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
        this.query_global_particles();
        // this.message_selected_particle();
        this.drag_global_particles();
    }


    // Looks in the global node target particles and returns the particle that the mouse is over
    query_global_particles() {

        if (this.dragging == false) {
            
            this.selected_element = null;
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

    // shows the element that the mouse is over
    show_debug(){
        
        text("selected element: ", mouseX+20, mouseY+10)
        if(this.selected_element != null) {
            text(this.selected_element_label, mouseX+20, mouseY+20)
        } else {
            text("none", mouseX+20, mouseY+20)}

    }

}