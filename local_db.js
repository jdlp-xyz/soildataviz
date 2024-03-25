// Local database
// Defines a series of classes that stores and handles the information of different records. First a general localdb object with arrays that contain the nodes, then a abstract node class that only contains the semantic id and the record id, and then specific classes that extend from the node, that can fetch specific fields of information and relationships between the nodes.




// The general local DB, that stores all the node objects in the network.
class LocalDB {

    constructor() {

        // TODO this object should separate different strategies to build the database. The actual build methods should be put in a strategy called bulk download or something like that. The default strategy should be to build the database from a json or csv file stored locally.


        // An array of each kind of node in the database.
        console.log("local database created!")

        // Data
        this.constituents_nodes = [];
        this.exhibition_nodes = [];
        this.membership_nodes = [];
        this.years_nodes = [];

        // Build the baseline data from the json files.
        this.build_objects_from_json_data().then(() => {

            // Build the cross references between the nodes.
            this.build_cross_reference();
        });
        //

        

        // State
        this.is_ready = false;

    }

    //Builds the baseline data for the local database from the json files.
    build_objects_from_json_data() {

        return new Promise((resolve, reject) => {

             // Constituents

            for (let i = 0; i < Object.keys(localdata_constituents).length; i++) {
                this.constituents_nodes.push(
                    
                    new ConstituentsNode(

                        // Required fields
                        localdata_constituents[i].semantic_id,
                        localdata_constituents[i].record_id,
                        localdata_constituents[i].first_name,
                        localdata_constituents[i].last_name,

                    ));

                    // Add optional fields
                    if(localdata_constituents[i].soil_link != undefined) {
                        this.constituents_nodes[i].soil_link = localdata_constituents[i].soil_link;
                    }
                    if(localdata_constituents[i].membership_record_id != undefined) {
                        this.constituents_nodes[i].membership_record_ids = localdata_constituents[i].membership_record_id;
                    }
                    if(localdata_constituents[i].exhibitions_artist_record_ids != undefined) {
                        this.constituents_nodes[i].exhibitions_artist_record_ids = localdata_constituents[i].exhibitions_artist_record_ids;
                    }
                    if(localdata_constituents[i].exhibitions_curator_record_id != undefined) {
                        this.constituents_nodes[i].exhibitions_curator_record_ids = localdata_constituents[i].exhibitions_curator_record_ids;
                    }

            }


            // Membership
            for(let i = 0; i < Object.keys(localdata_memberships).length; i++) {

                this.membership_nodes.push(new MembershipNode(
                    localdata_memberships[i].semantic_id,
                    localdata_memberships[i].record_id,
                    localdata_memberships[i].year_record_id[0],
                    localdata_memberships[i].constituents_record_ids
                ))

            }

            // Years
            // We're building the years nodes based on the reference present in the membership nodes.

            //parseInt(localdb.membership_nodes[0].semantic_id.slice(0,4))

            for(let i = 0; i < Object.keys(localdata_memberships).length; i++) {

                this.years_nodes.push(new YearsNode(

                    // Year number based on the membership year
                    localdata_memberships[i].semantic_id.slice(0,4),
                    localdata_memberships[i].year_record_id[0],
                    parseInt(localdata_memberships[i].semantic_id.slice(0,4)),

                ))
            }
            


            // Exhibitions

            for (let i = 0; i < Object.keys(localdata_exhibitions).length; i++) {

                this.exhibition_nodes.push(

                    new ExhibitionNode(
                        
                        localdata_exhibitions[i].semantic_id,
                        localdata_exhibitions[i].record_id,
                        localdata_exhibitions[i].title,
                        localdata_exhibitions[i].year_record_id,
                        localdata_exhibitions[i].artist_record_ids,
                        // TODO Integrate curators in a next iteration.
                        //localdata_exhibitions[i].curator_record_ids


                    )

                    // Optional
                    //url

                )
            }
            console.log("Building objects from json data...");
            resolve();
        })

        
       
       

        


   }

    
    /**
     * A function to build the cross reference for all the nodes in the local db.
     */
    //TODO this could be refactored
    build_cross_reference() {

        console.log("building cross reference")

        // constituents
        for (let i = 0; i < this.constituents_nodes.length; i++) {

            this.constituents_nodes[i].cross_reference_nodes();

        }

        // exhibitions
        for (let i = 0; i < this.exhibition_nodes.length; i++) {

            this.exhibition_nodes[i].cross_reference_nodes();

        }

        // years
        for (let i = 0; i < this.years_nodes.length; i++) {

            this.years_nodes[i].cross_reference_nodes();

        }

        // membership
        for (let i = 0; i < this.membership_nodes.length; i++) {

            this.membership_nodes[i].cross_reference_nodes();

        }


        this.localdb_ready()


    }

    //TODO this should check if the database is in fact ready and then return a true or false statement
    localdb_ready() {

        console.log("Local db: local db is ready");
        this.is_ready = true;

        // TODO replace. What is calling this function should run this function.
        //build_visualization();


    }

    getNodesAsArray(arrayname){
        return Object.values(this.arrayname);
     
     }




    // Build whole db tables
    // Takes all the nodes in the local db and builds a p5 table of nodes and talbes, returns a object with those two tables
    // build_whole_db_tables(){

    //     // create an object that holds the nodes table and the edges table
    //     let tables = {

    //         nodes: new p5.Table(),
    //         edges: new p5.Table()

    //     };
        
    //     // add headers to each table
            
    //     // nodes headers
    //     tables.nodes.addColumn('title');
    //     tables.nodes.addColumn('nodetype');
    //     tables.nodes.addColumn('weight');
    //     tables.nodes.addColumn('record_id');

    //     // add all the nodes to the nodes table
    //     tables.edges.addColumn('source');
    //     tables.edges.addColumn('target');


    //     // read the local db and write the nodes to the nodes

    //     let default_weight = 1;
        
    //     // constituents_nodes
    //     for (let i = 0; i < this.constituents_nodes.length; i++) {

    //         let title = this.constituents_nodes[i].first_name+" "+this.constituents_nodes[i].last_name;
            
    //         let newRow = tables.nodes.addRow();
    //         newRow.setString('title', title);
    //         newRow.setString('nodetype', 'constituent');
    //         newRow.setString('weight', default_weight);
    //         newRow.setString('record_id', this.constituents_nodes[i].record_id);

    //     }
        

    //     // exhibition_nodes

    //     for (let i = 0; i < this.exhibition_nodes.length; i++) {


    //         let default_weight = 15;

    //         let title = this.exhibition_nodes[i].exhibition_title;
            
    //         let newRow = tables.nodes.addRow();
    //         newRow.setString('title', title);
    //         newRow.setString('nodetype', 'exhibition');
    //         newRow.setString('weight', default_weight);
    //         newRow.setString('record_id', this.exhibition_nodes[i].record_id);
           

    //     }


    //     // membership_nodes

    //     for (let i = 0; i < this.membership_nodes.length; i++) {

    //         let title = this.membership_nodes[i].semantic_id; // needs work
            
    //         let newRow = tables.nodes.addRow();
    //         newRow.setString('title', title);
    //         newRow.setString('nodetype', 'membership');
    //         newRow.setString('weight', default_weight);
    //         newRow.setString('record_id', this.membership_nodes[i].record_id);

    //     }

    //     // publication_nodes

    //     for (let i = 0; i < this.publication_nodes.length; i++) {

    //         let title = this.publication_nodes[i].publication_title;
            
    //         let newRow = tables.nodes.addRow();
    //         newRow.setString('title', title);
    //         newRow.setString('nodetype', 'publication');
    //         newRow.setString('weight', default_weight);
    //         newRow.setString('record_id', this.publication_nodes[i].record_id);
           

    //     }

    //     // years_nodes
    //     for (let i = 0; i < this.years_nodes.length; i++) {

    //         let title = this.years_nodes[i].semantic_id; // needs work
            
    //         let newRow = tables.nodes.addRow();
    //         newRow.setString('title', title);
    //         newRow.setString('nodetype', 'years');
    //         newRow.setString('weight', default_weight);
    //         newRow.setString('record_id', this.years_nodes[i].record_id);

    //     }

    //     // read the local db and write the edges to the edges talbe.
        

    //     // constituents_nodes

    //     for (let i = 0; i < this.constituents_nodes.length; i++) {

    //         // Current node neigbours
    //         let node_neighbours = this.constituents_nodes[i].get_neighbours();

    //         // For each neighbour, add a row between the current 
    //         for (let j = 0; j < node_neighbours.length; j++) {

    //             let newRow = tables.edges.addRow();

    //             newRow.setString('source', this.constituents_nodes[i].record_id);
    //             newRow.setString('target', node_neighbours[j].record_id);


    //         }
    //     }


    //     // exhibition_nodes

    //     for (let i = 0; i < this.exhibition_nodes.length; i++) {

    //         // Current node neigbours
    //         let node_neighbours = this.exhibition_nodes[i].get_neighbours();

    //         // For each neighbour, add a row between the current 
    //         for (let j = 0; j < node_neighbours.length; j++) {

    //             let newRow = tables.edges.addRow();

    //             newRow.setString('source', this.exhibition_nodes[i].record_id);
    //             newRow.setString('target', node_neighbours[j].record_id);


    //         }
    //     }

    //     // membership_nodes

    //     for (let i = 0; i < this.membership_nodes.length; i++) {

    //         // Current node neigbours
    //         let node_neighbours = this.membership_nodes[i].get_neighbours();

    //         // For each neighbour, add a row between the current 
    //         for (let j = 0; j < node_neighbours.length; j++) {

    //             let newRow = tables.edges.addRow();

    //             newRow.setString('source', this.membership_nodes[i].record_id);
    //             newRow.setString('target', node_neighbours[j].record_id);


    //         }
    //     }


    //     // publication_nodes

    //     for (let i = 0; i < this.publication_nodes.length; i++) {

    //         // Current node neigbours
    //         let node_neighbours = this.publication_nodes[i].get_neighbours();

    //         // For each neighbour, add a row between the current 
    //         for (let j = 0; j < node_neighbours.length; j++) {

    //             let newRow = tables.edges.addRow();

    //             newRow.setString('source', this.publication_nodes[i].record_id);
    //             newRow.setString('target', node_neighbours[j].record_id);


    //         }
    //     }


    //     // years_nodes

    //     for (let i = 0; i < this.years_nodes.length; i++) {

    //         // Current node neigbours
    //         let node_neighbours = this.years_nodes[i].get_neighbours();

    //         // For each neighbour, add a row between the current 
    //         for (let j = 0; j < node_neighbours.length; j++) {

    //             let newRow = tables.edges.addRow();

    //             newRow.setString('source', this.years_nodes[i].record_id);
    //             newRow.setString('target', node_neighbours[j].record_id);


    //         }
    //     }

    //     // return the tables object

    //     return tables;


    // }

    // Returns an array of nodes from a filter
    // get_filtered_nodes(filters){

    //     let filtered_nodes = [];

    //     // Add nodes for each filter in the filters array
    //     for (let i = 0; i < filters.length; i++) {

    //         let filter = filters[i];


    //         switch(filter) {

    //             case("constituents-members"):
    //                 console.log("Get filtered nodes: Getting constituents members.")

    //                 // Ask every node in constituents nodes if is a member. If true, push the node reference to filtered nodes

    //                 for (let i = 0; i < this.constituents_nodes.length; i++){

    //                     if (this.constituents_nodes[i].get_is_a_constituent_member()){
    //                         filtered_nodes.push(this.constituents_nodes[i]);
    //                     }

    //                 }
    //                 break;

    //             case("membership"):
    //                 console.log("Get filtered nodes: Membership years")


    //                 for (let i = 0; i < this.membership_nodes.length; i++){

    //                         filtered_nodes.push(this.membership_nodes[i]);
    //                         //console.log("adding ", this.membership_nodes[i].get_title(), " to the selected nodes")
    //                 }

    //                 break;

    //             case("members-and-its-constituents"):
    //                 console.log("Get filtered nodes: Members and its constituents");

    //                 for (let i = 0; i < this.membership_nodes.length; i++){

    //                     filtered_nodes.push(this.membership_nodes[i]);
    //                     //console.log("adding ", this.membership_nodes[i].get_title(), " to the selected nodes")

    //                     // For each membership node, add all the neighbours
    //                     let neighbours = this.membership_nodes[i].get_neighbours();
    //                     for (let j = 0; j < neighbours.length; j++){

    //                         filtered_nodes.push(neighbours[j]);

    //                     }

    //                 }
                    
    //                 break;

    //             default:
    //                 console.log("Get filtered nodes: Unknown filter!")
    //                 break;



    //         }


    //     }

    //     return filtered_nodes;

    // }

    // Method to grab whole or a part of the local db and saves it into a csv for later use.
    // save_cache(filter){

    //     // First checks if the local database is ready.
    //     if(this.local_network_is_ready){

    //         // Initialize the ouput tables and 
    //         ouput_node_table


    //     }

    // }


}

// The abstract node class, that contains the semantic id and the record id.

class DBNode {

    constructor(semantic_id, record_id) {

        this.semantic_id = semantic_id;
        this.record_id = record_id;

    }


    get_node(node_array, record_ids) {

        let objectReferences = [];

        // search each
        try {

            if (record_ids.length > 0) {
                for (let i = 0; i < record_ids.length; i++) {

                    objectReferences.push(node_array.find(item => item.record_id === record_ids[i]))

                }
            }

        } catch (error) {
            //         console.log("Error: ", error)
        }

        return objectReferences;

    }

    get_title(){

        let title;

        switch(this.node_type){

            case("constituent"):
                title = this.first_name + " " + this.last_name;
                break;

            case("exhibition"):
                title = this.exhibition_title;
                break;

            case("membership"):
                title = this.semantic_id;
                break;

            case("publication"):
                title = this.publication_title;
                break;

            case("years"):
                title = this.semantic_id;
                break;

            default:
                title = "Unknown title";
                break;

        

        }

        return title;


    }


}



class ConstituentsNode extends DBNode {

    constructor(semantic_id, record_id, first_name, last_name, soil_link,  membership_record_ids, exhibitions_artist_record_ids, exhibitions_curator_record_ids, publications_record_ids) {

        // Calls the abstract node class constructor fields.
        super(semantic_id, record_id);
        this.node_type = "constituent"
        this.first_name = first_name;
        this.last_name = last_name;
        this.soil_link = soil_link;

        // Record ids fetched from the airtable database.

        this.membership_record_ids;
        this.exhibitions_artist_record_ids;
        this.exhibitions_curator_record_ids;
        this.publications_record_ids;

        // Node references 
        this.membership_nodes = [];
        this.exhibitions_artist_nodes = [];
        this.exhibition_curator_nodes = [];
        this.publication_nodes = [];


    }

    cross_reference_nodes() {

        // membership
        this.membership_nodes = this.get_node(localdb.membership_nodes, this.membership_record_ids);
        // exhibitions artist
        this.exhibitions_artist_nodes = this.get_node(localdb.exhibition_nodes, this.exhibitions_artist_record_ids);
        // exhibitions curator
        // this.exhibition_curator_nodes = this.get_node(localdb.exhibition_nodes, this.exhibitions_curator_record_ids);
 

    }

    get_exhibition_artist_record_ids() {
        return this.exhibitions_artist_record_ids;

    }

    get_full_name(){

        let full_name = this.first_name + " " + this.last_name;

        return full_name;

    }

    // It returns an array of years based on the membership years
    get_membership_as_years_array(){

        let years_array = [];

        if(this.membership_nodes.length > 0){

            for (let i = 0; i < this.membership_nodes.length; i++){
                //console.log("membership node: ", this.membership_nodes[i])
                let year = this.membership_nodes[i].year[0].semantic_id;
                year = year.toString();
                years_array.push(year);

            }

        }

        return years_array;

    }

    // Returns a list of neighbours of the node.
    get_neighbours(){


        let neighbours = [];

        if(this.membership_nodes.length > 0){
         
            for (let i = 0; i < this.membership_nodes.length; i++){

                neighbours.push(this.membership_nodes[i]);

            }

        }

        if(this.exhibitions_artist_nodes.length > 0){
         
            for (let i = 0; i < this.exhibitions_artist_nodes.length; i++){

                neighbours.push(this.exhibitions_artist_nodes[i]);

            }

        }

        // if(this.exhibition_curator_nodes.length > 0){

        //     for (let i = 0; i < this.exhibition_curator_nodes.length; i++){

        //         neighbours.push(this.exhibition_curator_nodes[i]);

        //     }

        // }



        return neighbours;

    }

    // Returns a true if this constituent is also a member
    get_is_a_constituent_member(){

        let has_membership;

        if (this.membership_nodes.length > 0) {

            has_membership = true;

        } else {
            has_membership = false;
        }

        return has_membership;
    }
    

}

class ExhibitionNode extends DBNode {

    constructor(semantic_id, record_id, exhibition_title, date_year_record_id, artists_record_ids) {

        // Calls the abstract node class constructor fields. 
        super(semantic_id, record_id);

        this.node_type = "exhibition"
        this.exhibition_title = exhibition_title;
        this.description = ''; // We don't have this field in the airtable database. We will use it later to fetch the description of the exhibition. 
        this.url;

        this.date_year_record_id = date_year_record_id; // Contains a record id for a node year.
        this.date_year; // Reference for node year
        this.date_month;

        // Record ids fetched from the airtable database. 
        this.artists_record_ids = artists_record_ids;
        // TODO integrate curator in next iteration
        //this.exhibitions_curator_record_ids = curator_record_id;

        // Node references
        this.artists_nodes = [];
        this.curator_node = [];

    }

    cross_reference_nodes() {

        // year
        this.date_year = this.get_node(localdb.years_nodes, this.date_year_record_id);
        // artist
        this.artists_nodes = this.get_node(localdb.constituents_nodes, this.artists_record_ids);
        // curator
      //  this.curator_node = this.get_node(localdb.constituents_nodes, this.exhibitions_curator_record_ids);

    }

       // Returns a list of neighbours of the node.
       get_neighbours(){


        let neighbours = [];

            if(this.date_year.length > 0){
            
                for (let i = 0; i < this.date_year.length; i++){

                    neighbours.push(this.date_year[i]);

                }

            }

            if(this.artists_nodes.length > 0){

                for (let i = 0; i < this.artists_nodes.length; i++){

                    neighbours.push(this.artists_nodes[i]);

                }

            }



            return neighbours;

    }

}

// class PublicationNode extends DBNode {

//     constructor(semantic_id, record_id, publication_title, isbn, publication_year_record_id, authors_record_ids) {

//         // Calls the abstract node class constructor fields. 
//         super(semantic_id, record_id);

//         this.node_type = "publication"
//         this.publication_title = publication_title;
//         this.isbn = isbn;
//         this.publication_year_record_id = publication_year_record_id;
//         this.publication_year = null;
//         this.authors_record_ids = authors_record_ids;

//         this.authors_nodes = [];

//     }

//     cross_reference_nodes() {

//         // year
//         this.publication_year = this.get_node(localdb.years_nodes, this.publication_year_record_id);
//         // authors
//         this.authors_nodes = this.get_node(localdb.constituents_nodes, this.authors_record_ids);

//     }

//     // Returns a list of neighbours of the node.
//     get_neighbours(){


//         let neighbours = [];

//         if(this.publication_year.length > 0){
         
//             for (let i = 0; i < this.year.length; i++){

//                 neighbours.push(this.year[i]);

//             }

//         }

//         if(this.authors_nodes.length > 0){
         
//             for (let i = 0; i < this.authors_nodes.length; i++){

//                 neighbours.push(this.authors_nodes[i]);

//             }

//         }

//         return neighbours;

//     }

// }

class YearsNode extends DBNode {

    constructor(semantic_id, record_id, year) {

        // Calls the abstract node class constructor fields. 
        super(semantic_id, record_id);

        this.node_type = "years"
        this.year = year;
  
        this.exhibitions_nodes = []; // object references
        this.membership_nodes = [] // object references

    }

    cross_reference_nodes(){

        // exhibitions
        this.exhibitions_nodes = this.get_node(localdb.exhibition_nodes, this.exhibition_record_ids);
        // membership
        this.membership_nodes = this.get_node(localdb.membership_nodes, this.membership_record_id);


    }


    // Returns a list of neighbours of the node.
    get_neighbours() {


        let neighbours = [];

        if (this.exhibitions_nodes.length > 0) {

            for (let i = 0; i < this.exhibitions_nodes.length; i++) {

                neighbours.push(this.exhibitions_nodes[i]);

            }

        }

        if (this.membership_nodes.length > 0) {

            for (let i = 0; i < this.membership_nodes.length; i++) {

                neighbours.push(this.membership_nodes[i]);

            }

        }

        return neighbours;

    }




}



class MembershipNode extends DBNode {

    constructor(semantic_id, record_id, year_record_id, constituents_record_ids) {

        // Calls the abstract node class constructor fields. 
        super(semantic_id, record_id);

        this.node_type = "membership"
        this.year_record_id = year_record_id; // record id
        this.year; // object reference

        this.constituents_record_ids = constituents_record_ids;
        this.constituents_nodes = [] // objects reference

    }

    cross_reference_nodes(){

        // year
        //this.year = this.get_node(localdb.years_nodes, this.year_record_id);
        this.year = get_single_node(localdb.years_nodes, this.year_record_id);
        // constituents
        this.constituents_nodes = this.get_node(localdb.constituents_nodes, this.constituents_record_ids);

    }

    // Returns a list of neighbours of the node.
    get_neighbours() {

        //year
        //constituents

        let neighbours = [];

        if (this.year.length > 0) {

            for (let i = 0; i < this.year.length; i++) {

                neighbours.push(this.year[i]);

            }

        }

        if (this.constituents_nodes.length > 0) {

            for (let i = 0; i < this.constituents_nodes.length; i++) {

                neighbours.push(this.constituents_nodes[i]);

            }

        }




        return neighbours;

    }

    get_year_name(){

        let year_name = this.year.semantic_id;
        return year_name

    }

}

// Edge class
class Edge {

    constructor(source, target) {

        this.source = source;
        this.target = target;
        this.weight = 1;
        this.comment = '';

    }

    get_edge(direction){

        switch(direction){

            case "inverted":
                return [this.target, this.source];
            case "normal":
                return [this.source, this.target];
            default:
                return [this.source, this.target];

        }
    }

}


// return a node object reference from a node array by its record id.
function get_single_node(node_array, record_id) {

    let objectReference;

    // search each
    try {

        objectReference = node_array.find(item => item.record_id === record_id)

    } catch (error) {
        //         console.log("Error: ", error)
    }

    return objectReference;

}

//Searchs for a node in all the available arrays in localdb
function  get_single_node_anywhere(record_id){
    
    // The referene to return
    let objectReference;

    // search each array
    if(get_single_node(localdb.constituents_nodes, record_id) != undefined){
        objectReference = get_single_node(localdb.constituents_nodes, record_id)
    } else if(get_single_node(localdb.exhibition_nodes, record_id) != undefined){
        objectReference = get_single_node(localdb.exhibition_nodes, record_id)
    } else if(get_single_node(localdb.years_nodes, record_id) != undefined){
        objectReference = get_single_node(localdb.years_nodes, record_id)
    } else if(get_single_node(localdb.membership_nodes, record_id) != undefined){
        objectReference = get_single_node(localdb.membership_nodes, record_id)
    }

    return objectReference;

}


// 

// 


// Given a set of db nodes, build and return an array of edges
function build_edges_from_nodes(nodes){

    // Initialize the edge array for ouput
    
    let edges = [];
    let input_nodes = nodes;
    console.log("Build edges from nodes: ", input_nodes.length, "nodes added, building edges...");

    // For each db_node in the input, call its neigbours
    for (let i = 0; i < input_nodes.length; i++) {

        let neighbours;
        // adapt if the input nodes are a viznode o a dbnode
        if(nodes[0] instanceof VizParticle){
            //viznode
            neighbours = input_nodes[i].dbnode.get_neighbours();    
        } else{
            //dbnode
            neighbours = input_nodes[i].get_neighbours();
        }

        console.log("Node", input_nodes[i].semantic_id, " has ", neighbours.length, " neigbours.");

        // Are those neigbours present in the input?
        for (let j = 0; j < neighbours.length; j++) {

            let neighbour_is_present;

            if (get_single_node(input_nodes,neighbours[j].record_id) != null){

                neighbour_is_present = true;

            } else {
                neighbour_is_present = false;
            }

            if(neighbour_is_present){

                edges.push(new Edge(input_nodes[i], neighbours[j]));
                console.log("Edge added: ", input_nodes[i].semantic_id, neighbours[j].semantic_id);

            }

        }

        



    }

    console.log("Build edges: ", edges.length, " created.");

    return edges;
    

}



 



// Reads the local db and then exports a set of tables with all the data
function export_localdb_to_json(){

    console.log("Exporting local db to csv...");

    // Initialize the objects to store the ouput

    // 1. Constituent

    // Prepare a object only with the basic data for each constituent node

    let constituent_nodes_to_export = [];
    for (let i = 0 ; i < localdb.constituents_nodes.length; i++){
        
        constituent_nodes_to_export.push({
            
            semantic_id : localdb.constituents_nodes[i].semantic_id, 
            record_id : localdb.constituents_nodes[i].record_id,
            first_name : localdb.constituents_nodes[i].first_name,
            last_name : localdb.constituents_nodes[i].last_name,
            soil_link : localdb.constituents_nodes[i].soil_link,
            membership_record_id: localdb.constituents_nodes[i].membership_record_ids,
            exhibitions_artist_record_ids : localdb.constituents_nodes[i].exhibitions_artist_record_ids,
            exhibitions_curator_record_ids : localdb.constituents_nodes[i].exhibitions_curator_record_ids

        });

    }


    console.log("Exporting Constituent nodes");

    // export nodes
    let writer_constituent = createWriter('constituent_nodes.json'); 

    
    writer_constituent.print(JSON.stringify(constituent_nodes_to_export));

    
    
    writer_constituent.close();
    writer_constituent.clear();



    // 2. Exhibition
    
    // Prepare a object only with the basic data for each constituent node

    let exhibition_nodes_to_export = [];
    for (let i = 0 ; i < localdb.exhibition_nodes.length; i++){
        
        exhibition_nodes_to_export.push({
            
            semantic_id : localdb.exhibition_nodes[i].semantic_id, 
            record_id : localdb.exhibition_nodes[i].record_id,
            exhibition_title : localdb.exhibition_nodes[i].exhibition_title,
            url : localdb.exhibition_nodes[i].url,
            year_record_id : localdb.exhibition_nodes[i].date_year_record_id,
            artist_record_ids : localdb.exhibition_nodes[i].artists_record_ids,
            curator_record_ids : localdb.exhibition_nodes[i].curators_record_ids

        });

    }


    console.log("Exporting Exhibition nodes");

    // export nodes
    let writer_exhibitions = createWriter('exhibitions_nodes.json'); 
    writer_exhibitions.print(JSON.stringify(exhibition_nodes_to_export));
    writer_exhibitions.close();
    writer_exhibitions.clear();


    // 3. Membership
    

    let membership_nodes_to_export = [];
    for (let i = 0 ; i < localdb.membership_nodes.length; i++){
        
        membership_nodes_to_export.push({
            
            semantic_id : localdb.membership_nodes[i].semantic_id, 
            record_id : localdb.membership_nodes[i].record_id,
            year_record_id : localdb.membership_nodes[i].year_record_id,
            constituents_record_ids : localdb.membership_nodes[i].constituents_record_ids


        });

    }


    console.log("Exporting Exhibition nodes");

    // export nodes
    let writer_membership = createWriter('membership_nodes.json'); 
    writer_membership.print(JSON.stringify(membership_nodes_to_export));
    writer_membership.close();
    writer_membership.clear();
    

}


// LEGACY CODE, TO REVIEW LATER TO IMPLEMENT AIRTABLE UPDATE.



 // //  to bulk strategy
    // // Build the basic constituents database, only with its semantic and record id
    // async build_constituents_db() {

    //     console.log("Local db: building constituents db")
    //     // Get the basic data from all the constituents in the airtable database. Data is stored
    //     await db_get_constituents()
    //     console.log("got the data, building constituents nodes")

    //     // Build a Constituents object for each entry on the temp data
    //     for (let i = 0; i < localdb_tempdata_constituents.length; i++) {

    //         this.constituents_nodes.push(new ConstituentsNode(localdb_tempdata_constituents[i][0], localdb_tempdata_constituents[i][1], localdb_tempdata_constituents[i][2], localdb_tempdata_constituents[i][3], localdb_tempdata_constituents[i][4], localdb_tempdata_constituents[i][5], localdb_tempdata_constituents[i][6], localdb_tempdata_constituents[i][7], localdb_tempdata_constituents[i][8], localdb_tempdata_constituents[i][9], localdb_tempdata_constituents[i][10], localdb_tempdata_constituents[i][11],))

    //     }

    //     // clear temp data
    //     clear_localdb_tempdata()
    // }

    // //  to bulk strategy
    // async build_exhibitions_db() {

    //     console.log("Local db: building exhibitions db")
    //     // Get the basic data from all the constituents in the airtable database. Data is stored
    //     await db_get_exhibitions()
    //     console.log("got the data, building exhibition nodes")

    //     // Build a Constituents object for each entry on the temp data
    //     for (let i = 0; i < localdb_tempdata_exhibitions.length; i++) {

    //         this.exhibition_nodes.push(new ExhibitionNode(localdb_tempdata_exhibitions[i][0], localdb_tempdata_exhibitions[i][1], localdb_tempdata_exhibitions[i][2], localdb_tempdata_exhibitions[i][3], localdb_tempdata_exhibitions[i][4], localdb_tempdata_exhibitions[i][5], localdb_tempdata_exhibitions[i][6], localdb_tempdata_exhibitions[i][7]))

    //     }

    //     // clear temp data
    //     clear_localdb_tempdata()
    // }

    // //  to bulk strategy
    // async build_publications_db() {

    //     console.log("Local db: building publications db")
    //     // Get the basic data from all the publications in the airtable database. Data is stored
    //     await db_get_publications()
    //     console.log("got the data, building publication nodes")

    //     // Build a Constituents object for each entry on the temp data
    //     for (let i = 0; i < localdb_tempdata_publications.length; i++) {

    //         this.publication_nodes.push(new PublicationNode(localdb_tempdata_publications[i][0], localdb_tempdata_publications[i][1], localdb_tempdata_publications[i][2], localdb_tempdata_publications[i][3], localdb_tempdata_publications[i][4], localdb_tempdata_publications[i][5]))

    //     }

    //     // clear temp data
    //     clear_localdb_tempdata();


    // }

    // //  to bulk strategy
    // async build_years_db() {

    //     console.log("Local db: building years db")
    //     // Get the basic data from all the publications in the airtable database. Data is stored
    //     await db_get_years()
    //     console.log("got the data, building year nodes")

    //     // Build a Constituents object for each entry on the temp data
    //     for (let i = 0; i < localdb_tempdata_years.length; i++) {

    //         this.years_nodes.push(new YearsNode(localdb_tempdata_years[i][0], localdb_tempdata_years[i][1], localdb_tempdata_years[i][2], localdb_tempdata_years[i][3], localdb_tempdata_years[i][4]))

    //     }
    //     // clear temp data
    //     clear_localdb_tempdata();
    // }

    // //  to bulk strategy
    // async build_membership_db() {

    //     console.log("Local db: building membership db")
    //     // Get the basic data from all the publications in the airtable database. Data is stored
    //     await db_get_membership()
    //     console.log("got the data, building membership nodes")

    //     // Build a Constituents object for each entry on the temp data
    //     for (let i = 0; i < localdb_tempdata_membership.length; i++) {

    //         this.membership_nodes.push(new MembershipNode(localdb_tempdata_membership[i][0], localdb_tempdata_membership[i][1], localdb_tempdata_membership[i][2], localdb_tempdata_membership[i][3]))

    //     }
    //     // clear temp data
    //     clear_localdb_tempdata();
    // }

    //const localdb_initialization_secuence = [
        //     'build_constituents_db',
        //     'build_exhibitions_db',
        //     'build_publications_db',
        //     'build_years_db',
        //     'build_membership_db',
        //     'build_cross_reference',
        //     'localdb_ready'
        //   ];

    //function initialize_localdb_from_airtable(object, methods, delay) {
        //     let index = 0;
          
        //     function executeNextMethod() {
        //       if (index < methods.length) {
        //         const method = methods[index];
        //         object[method](); // Call the method
          
        //         // Increment the index for the next method
        //         index++;
          
        //         // Call this function again after the specified delay
        //         setTimeout(executeNextMethod, delay);
        
        //       }
        //     }
          
        //     // Start the process by calling the first method
        //     executeNextMethod();
        //   }