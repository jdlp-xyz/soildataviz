// Visualization

// STARTING FUNCIONS

// Build visualization secuence (excecuted after the db is ready)
// TODO this sould be in the viz_builder class
function build_visualization(){

    years = new MembershipYearsNodes();
    // create fake persons
    people = new PeopleNodes();
    // create timeline curve
    timelineCurve = new TimelineCurve(years.get_years_amount());

    // create the visualizarion of the persons
    vizpeople = new VizPeople();
    vizpeople.build_people_network();

}

// CLASS DEFINITIONS

// Draws a curved timeline

class TimelineCurve{

    // TODO this composition must change regarding the modificatons in screen size. This is a object to render in global view, where maybe we're going to implement grab screen or something that allows to zoom in and out.
    constructor(years){

        this.margin_horizontal = 80;
        this.margin_vertical = 80;
        this.curve_tightness = 1;
        this.start_point = createVector(lerp(0,width,0.15),lerp(0,height,0.15));
        this.points_amount = years*12;
        this.points = [];
        this.end_point = createVector(width - this.margin_horizontal, height - this.margin_vertical);
        this.build_timeline();

    }

    // builds the timeline points in a curve
    build_timeline(){

        let month_counter = 1;
        let year_counter = years.get_first_year_as_number();

        for (let i = 0; i < this.points_amount; i++){

            // Calculate positions to create a sin curve

            let x = lerp(0, width, map(sin(i/(this.points_amount/7.5)), 0,1,0.5,0.9));

            let y = lerp(0, height, map(i, -30, this.points_amount+30, 0, 1))
            

                this.points.push(new VizTimelinePoint(x,y, years.get_year(year_counter), month_counter));
                month_counter++;
            

            if (month_counter > 12){
                month_counter = 1;
                year_counter++;
            }


        }


    }

    display(){

        // Display all the points
        for (let i = 0; i < this.points.length; i++){
            this.points[i].display();
        
        }


    }

    get_timelinePoint_by_year(yearname){

        let timelinePoint_to_return;

        for (let i = 0; i < this.points.length; i++){

            if (this.points[i].year.semantic_id.toString() == yearname && this.points[i].month == 1){

                timelinePoint_to_return = this.points[i];
            }
        }

        return timelinePoint_to_return
    }

}

// VizTimeline point
// This class represents a point on the timeline vizualization, that can be a month or a year, as a connection point to the person nodes.
class VizTimelinePoint {
    constructor(x, y, year, month) {
        this.pos = createVector(x, y);
        this.year = year;
        this.month = month;
        this.mass = 10;
        this.label;
        this.db_node;
        this.type;
        this.connections = [];
        this.style;
        this.set_type();
        this.set_style();

    }

    // displays the point
    display() {

        // push()
        // this.apply_style();
        // ellipse(this.pos.x,this.pos.y, 10,10);
        // pop()

        if(this.type == "year"){
            this.display_year();
        }
        if(this.type == "month"){
            this.display_month();
        }


    }

    display_year(){
        push()
            let connections_to_this_year = this.year.membership_nodes[0].constituents_nodes.length
            if (connections_to_this_year > 0) {
                fill(0);
                noStroke();
                ellipse(this.pos.x,this.pos.y, 12,12);
            } else {
                fill(255);
                stroke(0);
                strokeWeight(1);
                ellipse(this.pos.x,this.pos.y, 12,12);
            }
        pop()

            
            
        push()
            fill(0);
            noStroke();    
            textFont(fontRoboto)
            textSize(12)
            text(this.year.semantic_id, this.pos.x + 15, this.pos.y+4)
        pop()

    }

    display_month(){

        push()
            noStroke()
            fill(0);
            ellipse(this.pos.x,this.pos.y, 4,4);

        pop()

    }

    set_type(){

        if (this.month == 1){

            this.type = "year";

        } else {

            this.type = "month";
        }
    }

    get_mass(){

        return this.mass;

        
    }

    set_style(style){
        
        if(this.type == "year"){
            this.style = style_year;
        
        }
        if(this.type == "month"){
            this.style = style_month;
        }



    }

    // It applies the style of the point
    // TODO think on another way to code the style. maybe a more static way can work better.
    apply_style(){

        fill(this.style.color.r, this.style.color.g, this.style.color.b);
        if(this.style.stroke == "noStroke"){
            noStroke();
        } else { stroke(255); strokeWeight(1);}

    }
}

// Styles for year
const style_year = {
    color: {
        r: 0,
        g: 0,
        b: 0
        
    },
    stroke : "noStroke"
}
// Styles for month
const style_month = {
    color: {
        r: 100,
        g: 100,
        b: 100
        
    },
    stroke : "noStroke"
}

// This class contains the information object that makes a bridge between the localdb and the visualization

class MembershipYearsNodes{

    constructor(){
        this.years_reference = ["1995", "1996", "1997", "1998", "1999", "2000", "2001", "2002", "2003", "2004",
        "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014",
        "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026"
      ];

      this.years = [];
      this.build_years();
    }

    build_years(){

        // push the years in the localdb to the years array
        const years_in_localdb = localdb.years_nodes;

        for (let i = 0; i < years_in_localdb.length; i++){

            this.years.push(years_in_localdb[i]);

        }

    }

    get_random_year(){

        let random_year = this.years[Math.floor(Math.random()*this.years.length)];
        return random_year;

    }

    get_years_amount(){

        let years_amount = this.years.length;
        return years_amount;

    }

    get_first_year_as_number(){

        let first_year = parseInt(this.years[0].year);
        return first_year;

    

    }

    get_year(yearint){

        let year_as_string = yearint.toString();
        // search the string in the years array
        for (let i = 0; i < this.years.length; i++){

            if(year_as_string == this.years[i].year){
                return this.years[i];
            }

        }

    }
    


}

// Bridge of information betweeen the local db and the visualization
// TODO change the name of the class, it's a bit confusing
class PeopleNodes{

    constructor(){

        this.people = [];
        this.create_people()


    }

    create_people(){

        // Get constituents with membership
        let people_from_localdb = localdb.get_filtered_nodes(["constituents-members"]);

        // Push each person to the people array
        for (let i = 0; i < people_from_localdb.length; i++){

            this.people.push(people_from_localdb[i]);

        }

        // Sort the array by the lenght of membership nodes in each object
        this.people.sort(function(a, b) {
            return b.membership_nodes.length - a.membership_nodes.length;
          });
    }

}

// Class that holds the network of people viz nodes
class VizPeople{

    constructor(){
        this.viz_people = [];
        this.people_array = people.people;
        this.selected_node = null;
    }

    build_people_network(){

        // TODO here the idea is good, but we should find a middle point between ading one node at a time and putting them all at once. An this is going to be re written from the ground, because the altenation between the local and global views requires other kind of architecture.

        this.viz_people.push(new VizPerson(this, 0, this.people_array[0]))
    }

    create_next_vizperson(last_place_in_array){

        let last_node_position = last_place_in_array;

        // check if is the last person in the list
        if(last_node_position < this.people_array.length){

            this.viz_people.push(new VizPerson(this, last_node_position+1, this.people_array[last_node_position+1]))
            console.log("New person created: ", this.viz_people[last_node_position+1].label)
        } else{
            console.log("last node created")
        }

    }



    update(){
      
        // check selected nodes
        this.check_selected_node();
        // update all nodes
        for(let i = 0; i < this.viz_people.length; i++){
            this.viz_people[i].update();   
        }

    }

    check_selected_node(){

        this.selected_node = null;

        for(let i = 0; i < this.viz_people.length; i++){
            if(this.viz_people[i].check_mouse_selected()){
                this.selected_node = this.viz_people[i];
            }
        }

        // if no node is selected, make all nodes selected state default
        if(this.selected_node == null){
            for(let i = 0; i < this.viz_people.length; i++){
                this.viz_people[i].selected_state = "default";
            }
        } else {
            // make the selected node selected
            this.selected_node.selected_state = "selected";
            // make everyone else dimmed
            for(let i = 0; i < this.viz_people.length; i++){
               
                if(this.viz_people[i] != this.selected_node){
                    this.viz_people[i].selected_state = "dimmed";
                }
            
            }

        }
    }


}


class VizPerson{

    constructor(parent, place_in_parent_array, db_node){

        
        this.pos = createVector(random(width), random(height));
        this.vel = createVector(0,0);
        this.acc = createVector(0,0);
        this.mass = 1;//10
        
       
        this.parent = parent;
        this.place_in_people_array = place_in_parent_array;

        this.db_node = db_node;
        this.label = db_node.get_full_name();

        this.years_vizpoints = [];
        this.edges = []; // the vizperson holds the edges
        this.build_edges();

       
        //this.radius = map(10, 1,11,6,25); // 11 is the max 
        this.radius = this.calculate_radius();
        this.mu = 0.01;

        // this.maxSpeed = 2.5;
        // this.speed_reduction_factor = 2;

        // test
        this.maxSpeed = 10;
        this.speed_reduction_factor = (3*this.maxSpeed)/2;

        this.maxForce = 0.4;

        this.placing_threshold = 400;
        this.selected_state = "default"; // default, selected, dimmed
        
        

        // New idea for movement
        this.colliding_nodes = [];
        this.collision_distance = null;

        this.perception_radius = 400;
        this.state = "moving"; // moving, stopped, placed
        this.next_node_created = false;

        // initial speed towards the timeline
        //this.applyForce(this.calculate_timeline_mean())

        // Counts the placement tries
        this.placement_tries = 0;
        this.max_placement_tries = 30;



    }

    calculate_radius(){
        // get the node with the most connections
        let max_connections = 11

        let radius = map(this.years_vizpoints.length, 1, max_connections, 7, 14);
        return radius;
    }

    set_edges_selected_state(){

        if(this.edges.length > 0){

            for(let i = 0; i < this.edges.length; i++){
                this.edges[i].selected_state = this.selected_state;
            }

        }

    }
    
    update(){

        this.collision_detection();
       // this.check_mouse_selected();
        this.set_edges_selected_state();
        

        this.placing_in_timeline();

        if (this.state = "moving" || this.next_node_created == false) {
            let steering = this.arrive(this.calculate_years_middlepoint());
            this.applyForce(steering);
    
        }

        if (this.next_node_created == false) {
            this.vel.add(this.acc);
            this.vel.limit(this.maxSpeed);
            this.pos.add(this.vel);
            this.acc.set(0, 0);
        }

        this.display_edges();
        this.display_nodes();


        
    }

    placing_in_timeline(){

        if(this.next_node_created == false){

        switch(this.state){

            case "moving":
                break;

            
            case "stopped":
                console.log(this.label, "Stopped:")

                // is well placed?
                if(this.calculate_timeline_mean() < this.placing_threshold && this.is_a_node_too_close() == false){
                    this.state = "placed";
                    console.log("well placed, build next node")
                    
                    this.build_next_node();

                } else {

                    if(this.placement_tries < this.max_placement_tries){
                        
                        this.placement_tries++;
                        console.log("bad placed, try again. try number", this.placement_tries);
                        this.pos.set(random(width), random(height)); // new random position
                        this.state = "moving";

                    } else {

                        console.log("Max tries reached. Build next node.")
                        this.build_next_node();
                        this.state = "placed";

                        
                    }


                }
                break;

            }

        }

    }

    build_next_node(){

        // tells parent node to create the next node

        if(this.parent.people_array.length - 1 > this.place_in_people_array){
            this.next_node_created = true;
            this.parent.create_next_vizperson(this.place_in_people_array);
        } else{
            console.log("this is the last node.");
            
        }
       
        
    }

    // NEW IDEA FOR MOVEMENT

    collision_detection(){

        // refresh colliding nodes
        this.colliding_nodes = [];

        // check for colliding nodes past the perception radius
        for (let i = 0; i < vizpeople.viz_people.length; i++){

            let distance_between_nodes = dist(this.pos.x, this.pos.y, vizpeople.viz_people[i].pos.x, vizpeople.viz_people[i].pos.y)

            if (distance_between_nodes < this.perception_radius && vizpeople.viz_people[i] != this){

                this.colliding_nodes.push(
                    
                    {node: vizpeople.viz_people[i], dist: distance_between_nodes}    
                    
                    );

            }
        }

        // check for colliding nodes with the timeline
        for (let i = 0; i < timelineCurve.points.length; i++){

            let distance_between_nodes = dist(this.pos.x, this.pos.y, timelineCurve.points[i].pos.x, timelineCurve.points[i].pos.y)

            if (distance_between_nodes < this.perception_radius){

                this.colliding_nodes.push(
                    
                    {node: timelineCurve.points[i], dist: distance_between_nodes}    
                    
                    );

            }
        }

        

    }

    is_a_node_too_close(){

        if(this.colliding_nodes.length > 0){

            let threshold = 50;
            let is_too_close;

            //sort the array by distance
            this.colliding_nodes.sort(function(a, b) {
                return a.dist - b.dist;
            
            });

            // check if the first node is too close
            if(this.colliding_nodes[0].dist < threshold){
                is_too_close = true;
                console.log(this.label, ": there's a node too close!")
            }else{
                is_too_close = false;
            }
            
            return is_too_close;
    } else{
        return false;
    }
        
    }

    // END NEW IDEA FOR MOVEMENT



    display_edges(){

        for (let i = 0; i < this.edges.length; i++){

            this.edges[i].display();

        }

    }

    calculate_timeline_mean(){

        let mean_between_timeline_points = 0;

        for ( let i = 0; i < this.years_vizpoints.length; i++){

            let dist_thispoint_timeline = dist(this.pos.x, this.pos.y, this.years_vizpoints[i].pos.x, this.years_vizpoints[i].pos.y);

            mean_between_timeline_points += dist_thispoint_timeline;

        }

        mean_between_timeline_points = mean_between_timeline_points / this.years_vizpoints.length;

        return mean_between_timeline_points;

    }


    build_edges(){

        // get the timelinePoint for each year
        //if(this.dbnode != null){

            let years_conections = this.db_node.get_membership_as_years_array();
            //console.log("Viz Person:", this.label, " has ", years_conections.length, " year connections...")


            if (years_conections.length > 0){

                for(let i = 0; i < years_conections.length; i++){

                    // 
                    let timelinepoint = timelineCurve.get_timelinePoint_by_year(years_conections[i]);
                  //  console.log("Viz Person:", this.label, " has ", timelinepoint.year, " year connection...")
                  this.years_vizpoints.push(timelinepoint);  
                  this.edges.push(new VizEdge(this.pos, timelinepoint.pos));
                  


                }

            }
        //}
    }

    set_db_node(node){
        this.db_node = node;
        this.label = this.db_node.get_full_name();
    
    }

    arrive(target) {
        // 2nd argument true enables the arrival behavior
        return this.seek(target, true);
    }

    seek(target, arrival = false) {
        let force = p5.Vector.sub(target, this.pos);
        let desiredSpeed = this.maxSpeed;
        if (arrival) {
          let slowRadius = this.perception_radius;
          let distance;
          
          // if colliding
          if(this.colliding_nodes.length > 0){

                distance = p5.Vector.sub(this.calculate_collision_middlepoint(), this.pos).mag();

          } else {
                distance = force.mag();
            
            }
          
            if (distance < slowRadius) {
                desiredSpeed = map(distance, 0, slowRadius*this.speed_reduction_factor, 0, this.maxSpeed);
            }

            if(desiredSpeed < 1){
                desiredSpeed = 0;
                this.state = "stopped";
            }

        }
        force.setMag(desiredSpeed);
        force.sub(this.vel);
        force.limit(this.maxForce);
        return force;
    }

    applyForce(force) {
        this.acc.add(force);
    }

    calculate_years_middlepoint() {
        let pos_array = this.years_vizpoints;
        let totalPuntos = pos_array.length;
        
        if (totalPuntos === 0) {
          // Manejo de caso especial si no hay puntos
          return null;
        }
      
        // Inicializar sumas
        var sumaX = 0;
        var sumaY = 0;
      
        // Sumar las coordenadas de todos los puntos
        for (var i = 0; i < totalPuntos; i++) {
          sumaX += pos_array[i].pos.x;
          sumaY += pos_array[i].pos.y;
        }
      
        // Calcular el punto medio
        var puntoMedioX = sumaX / totalPuntos;
        var puntoMedioY = sumaY / totalPuntos;
      
        //return { x: puntoMedioX, y: puntoMedioY };
        return createVector(puntoMedioX,puntoMedioY);
    }

    calculate_collision_middlepoint() {

        if(this.colliding_nodes.length > 0){

            let pos_array = this.colliding_nodes;
            let totalPuntos = pos_array.length;
            
            if (totalPuntos === 0) {
            // Manejo de caso especial si no hay puntos
            return null;
            }
        
            // Inicializar sumas
            var sumaX = 0;
            var sumaY = 0;
        
            // Sumar las coordenadas de todos los puntos
            for (var i = 0; i < totalPuntos; i++) {
            sumaX += pos_array[i].node.pos.x;
            sumaY += pos_array[i].node.pos.y;
            }
        
            // Calcular el punto medio
            var puntoMedioX = sumaX / totalPuntos;
            var puntoMedioY = sumaY / totalPuntos;
        
            //return { x: puntoMedioX, y: puntoMedioY };
            return createVector(puntoMedioX,puntoMedioY);
        }
    }

    dist_to_middlepoint(){

        let middlepoint = this.calculate_years_middlepoint();
        let dist_to_middlepoint = dist(this.pos.x, this.pos.y, middlepoint.x, middlepoint.y);
        return dist_to_middlepoint;

    }


    friction() {


            // shorcut to friction!
        // this.vel.mult(0.95);

        // Direction of Friction
        let friction = this.vel.copy();
        friction.normalize();
        friction.mult(-1);

        // chained version
        // let friction = this.vel.copy().normalize().mult(-1);



        // Magnitude of Friction
        let normal = this.mass;

        friction.setMag(this.mu * normal);
        this.applyForce(friction);



    }

    
    display_nodes(){

        push()
            
            ellipseMode(RADIUS);

            if (debug) {
                //debug: perception radius
                push();
                    noFill();
                    stroke(255, 0, 0);
                    ellipse(this.pos.x, this.pos.y, this.perception_radius,this.perception_radius);
                pop();

                            // debug, show collision
                push();
                if(this.colliding_nodes.length > 0){ 
                    fill("red")
                } else {
                    fill(255);
                }
                pop()

                // velocity
                text(this.vel.mag(), this.pos.x, this.pos.y+this.radius+25);


            // debug collding nodes
                if (this.colliding_nodes.length > 0) {
                    for(let i = 0; i < this.colliding_nodes.length; i++){
                        push();
                        stroke("green");
                        line(
                            this.pos.x, this.pos.y, 
                            this.colliding_nodes[i].node.pos.x,
                            this.colliding_nodes[i].node.pos.y
                        );
                        pop();
                    }
                }
            }


            push();

                style.set_person_node(this);
                ellipse(this.pos.x, this.pos.y, this.radius,this.radius);
            
            pop();

            push()
            textAlign(CENTER, TOP);
            if (this.selected_state == "selected") {
                textFont(fontRobotoMedium);
            }else{
                textFont(fontRoboto);
            }
            text(this.label, this.pos.x, this.pos.y+this.radius*1.5);
            pop()


            //text(this.vel.mag(), this.pos.x, this.pos.y+this.radius*1.5+30);
        pop()
    }

    check_mouse_selected(){

        let threshold = this.radius;
        let dist_to_mouse = dist(mouseX, mouseY, this.pos.x, this.pos.y);
       
        if (dist_to_mouse < threshold) {
           return true;
        } else {
            return false;
        }

    }

}


class VizEdge{

    constructor(source, target){

        this.source = source;
        this.target = target;
        this.selected_state = "default"; // default, selected, dimmed

    }

    display(){
        // push();
        //     style.set_edges(this);
        //     line(this.source.x, this.source.y, this.target.x, this.target.y);
        // pop();

        if(this.selected_state == "default"){
            push()
            strokeWeight(0.8)
            stroke(0, 50)
            line(this.source.x, this.source.y, this.target.x, this.target.y);
            pop()
        }

        
        if(this.selected_state == "dimmed"){
            push()
            strokeWeight(0.5)
            stroke(0, 20)
            line(this.source.x, this.source.y, this.target.x, this.target.y);
            pop()
        }

        if(this.selected_state == "selected"){
            push()
            strokeWeight(1)
            stroke(0, 255)
            line(this.source.x, this.source.y, this.target.x, this.target.y);
            pop()
        }


    }

    set_source(source){
        this.source = source;
    
    }

}

class VizStyle{

    constructor(name){
        this.name = name;
        
        this.person_node = {

            default:{
                stroke: false,
                strokeweight: 0,
                stroke_color: 0,
                fill_color: {
                    r: 0,
                    g: 0,
                    b: 0
                },
                fill_alpha: 255,
            },
            selected:{
                stroke: true,
                strokeweight: 1,
                stroke_color: {
                    r: 0,
                    g: 0,
                    b: 0
                },
                stroke_alpha: 255,
                fill_color: {
                    r: 255,
                    g: 255,
                    b: 255
                }
            },
            dimmed:{
                stroke: false,
                strokeweight: 0,
                stroke_color: 0,
                fill_color: {
                    r: 100,
                    g: 100,
                    b: 100
                },
                stroke_alpha: 255
            }

        }

        this.edge = {

            default:{
                stroke: true,
                strokeweight: 1,
                stroke_color: {
                    r: 50,
                    g: 50,
                    b: 50
                },
                stroke_alpha: 255

            },
            selected:{
                stroke: true,
                strokeweight: 1,
                stroke_color: {
                    r: 0,
                    g: 0,
                    b: 0
                },
                stroke_alpha: 255
            },
            dimmed:{
                stroke: true,
                strokeweight: 0,
                stroke_color: {
                    r: 100,
                    g: 100,
                    b: 100
                },
                stroke_alpha: 255
            }

        }

    }

    set_background(){
        background(255);
    
    }

    set_person_node(viznode){

        let style_source;

        // change from node selected state
        switch(viznode.selected_state){

            case "default":
                style_source = this.person_node.default;
                break;
            case "selected":
                style_source = this.person_node.selected;
                break;
            case "dimmed":
                style_source = this.person_node.dimmed;
                break
    
        }

        // stroke
        if(style_source.stroke = true){
            stroke(
                style_source.stroke_color.r,
                style_source.stroke_color.g,
                style_source.stroke_color.b,
                style_source.stroke_alpha);
            strokeWeight(style_source.strokeweight);
        } else {
            noStroke();
        }

        // fill
        fill(style_source.fill_color.r, 
            style_source.fill_color.g, 
            style_source.fill_color.b, 
            style_source.fill_alpha);

    }

    set_edges(edge){

        let style_source;

        switch(edge.selected_state){

            case "default":
                style_source = this.edge.default;
                break;
            case "selected":
                style_source = this.edge.selected;
                break;
            case "dimmed":
                style_source = this.edge.dimmed;
                break

        }

        // stroke
        if(style_source.stroke = true){
            stroke(
                style_source.stroke_color.r,
                style_source.stroke_color.g,
                style_source.stroke_color.b,
                style_source.stroke_alpha);
            strokeWeight(style_source.strokeweight);
        } else {
            noStroke();
        }

    }

}



// OTHER FUNCTIONS

function generateRandomString() {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomString = '';

    for (let i = 0; i < 10; i++) {
        const randomIndex = floor(random(characters.length));
        randomString += characters.charAt(randomIndex);
    }

    return randomString;
}


