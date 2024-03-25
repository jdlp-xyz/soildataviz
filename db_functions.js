
// // DATABASE FUNCTIONS
// // This script has handy functions to retrieve data from the airtable API in a simplified way

// // TODO this is not necesary, localdb should ask for the data and store inside itself, not in a global variable.
// // TODO this first should ask for a json local file with the base data. In a next iteration should check de airtable database for updates and add the additional information
// // Global array to store temporal data, a bridge between these functions and the objects. Remember to clean it after use.
// let localdb_tempdata_constituents = [];
// let localdb_tempdata_exhibitions = [];
// let localdb_tempdata_membership = [];
// let localdb_tempdata_publications = [];
// let localdb_tempdata_years = [];





// // Fetch the information from the constituents table and store it in the localdb_tempdata array.
// function db_get_constituents() {
//     return new Promise((resolve, reject) => {
//       console.log("Fetching data from the Constituents table and adding it to localdb_tempdata");
  
//       base('Constituents').select({
//         view: "Grid view",
//         //fields: ["Constituent ID", "Website", "Birth Country"],
//       }).eachPage(
//         function page(records, fetchNextPage) {
//           records.forEach(function (record) {
//             // Pushing constituents semantic and record id to the temp array.

//             localdb_tempdata_constituents.push([record.get('Constituent ID'), record.id, record.get('First Name'), record.get('Last name'), record.get('Website'), record.get('SOIL Link'), record.get('Birth Country'), record.get('Birth City'), record.get('Membership Years'), record.get('Exhibition ID (Artist)'), record.get('Exhibition ID (Curator)'), record.get('Publications (Author)')]);
//           });
//           fetchNextPage();
//         },
//         function done(err) {
//           if (err) {
//             console.error(err);
//             reject(err); // Reject the Promise on error
//           } else {
//             console.log(localdb_tempdata_constituents.length)
//             resolve(); // Resolve the Promise when done

//           }
//         }
//       );
//     });
//   }





//   function db_get_exhibitions() {
//     return new Promise((resolve, reject) => {
//       console.log("Fetching data from the Exhibitions table and adding it to localdb_tempdata");
  
//       base('Exhibitions').select({
//         view: "Grid view",
//       }).eachPage(
//         function page(records, fetchNextPage) {
//           records.forEach(function (record) {
            
//             //Reference of the constructor method in the object class
//             //semantic_id, record_id, exhibition_title, exhibition_url, date_year, date_month, artists_record_ids,curator_record_id
            
            
//             // Pushing constituents semantic and record id to the temp array.
//             localdb_tempdata_exhibitions.push([
              
//                 record.get('Exhibition ID'), 
//                 record.id, 
//                 record.get('Exhibition Title'), 
//                 record.get('URL'), 
//                 record.get('Year'), // record id of node year
//                 record.get('Month'), // record id of node year
//                 record.get('Artists'), // record id of artists nodes
//                 record.get('Curator') // record id of curator node
              
//               ]);
//           });
//           fetchNextPage();
//         },
//         function done(err) {
//           if (err) {
//             console.error(err);
//             reject(err); // Reject the Promise on error
//           } else {
//             resolve(); // Resolve the Promise when done
//           }
//         }
//       );
//     });
//   }

//   function db_get_publications() {
//     return new Promise((resolve, reject) => {
//       console.log("Fetching data from the Publications table and adding it to localdb_tempdata");
  
//       base('Publications').select({
//         view: "Grid view",
//       }).eachPage(
//         function page(records, fetchNextPage) {
//           records.forEach(function (record) {
            

//             localdb_tempdata_publications.push([
              
//                 record.get('Publication ID'), 
//                 record.id, 
//                 record.get('Publication Title'), 
//                 record.get('ISBN'), 
//                 record.get('Publication Year'),  // record id
//                 record.get('Authors') // record id of contituents nodes

              
//               ]);
//           });
//           fetchNextPage();
//         },
//         function done(err) {
//           if (err) {
//             console.error(err);
//             reject(err); // Reject the Promise on error
//           } else {
//             resolve(); // Resolve the Promise when done
//           }
//         }
//       );
//     });
//   }

//   function db_get_years() {
//     return new Promise((resolve, reject) => {
//       console.log("Fetching data from the Year table and adding it to localdb_tempdata");
  
//       base('Year').select({
//         view: "Grid view",
//       }).eachPage(
//         function page(records, fetchNextPage) {
//           records.forEach(function (record) {
            
            
            
            
//             // Pushing constituents semantic and record id to the temp array.
//             localdb_tempdata_years.push([
              
//                 record.get('Year'), 
//                 record.id, 
//                 record.get('Exhibitions'),  // record id
//                 record.get('Membership'), // record id
//                 record.get('Publications') // record id

              
//               ]);
//           });
//           fetchNextPage();
//         },
//         function done(err) {
//           if (err) {
//             console.error(err);
//             reject(err); // Reject the Promise on error
//           } else {
//             resolve(); // Resolve the Promise when done
//           }
//         }
//       );
//     });
//   }


//   function db_get_membership() {
//     return new Promise((resolve, reject) => {
//       console.log("Fetching data from the Membership table and adding it to localdb_tempdata");
  
//       base('Membership').select({
//         view: "Grid view",
//       }).eachPage(
//         function page(records, fetchNextPage) {
//           records.forEach(function (record) {
            
//             //Reference of the constructor method in the object class
//             //semantic_id, record_id, exhibition_title, exhibition_url, date_year, date_month, artists_record_ids,curator_record_id
            
            
//             // Pushing constituents semantic and record id to the temp array.
//             localdb_tempdata_membership.push([
              
//                 record.get('Name'), 
//                 record.id, 
//                 record.get('Year'), // record id
//                 record.get('Constituents') // record id

              
//               ]);
//           });
//           fetchNextPage();
//         },
//         function done(err) {
//           if (err) {
//             console.error(err);
//             reject(err); // Reject the Promise on error
//           } else {
//             resolve(); // Resolve the Promise when done
//           }
//         }
//       );
//     });
//   }


// function clear_localdb_tempdata(){

//     console.log("local db temp data cleared!")
//     //localdb_tempdata = [];
//     localdb_tempdata_exhibitions = [];
//     localdb_tempdata_publications = [];
//     localdb_tempdata_constituents = [];
//     localdb_tempdata_years = [];

// }


