
//
// SOIL DATABASE GRABBER. ONLY FOR LOCAL DEV USE.
//





var Airtable = require('airtable');
Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: 'pat9bbigTeNJDML15.320da82b6dd9062730b89eab884f1ecdb0f18e6faf3af9639964a64ba8645fe6'
});
var base = Airtable.base('appE7QVHOh5do4awF');
let startbutton, btn_download_files_as_json, download_const_json_button;
// Local objects to be converted to json files
let constituents = [];
let membership = [];

function setup() {
  // createCanvas(400, 400);
  let a = createP('SOIL DABASE GRABBER. ONLY FOR LOCAL DEV USE.'); 

  startbutton = createButton('Grab membership and constituents');
  startbutton.mousePressed(grab_databases);
  
  
  
}

function grab_databases() {
  //erase start button
  startbutton.remove();
  grab_constituents(constituents)
      .then(() => { grab_membership(membership) })
      .then(() => {

        btn_download_files_as_json = createButton('Download JSON files');
        btn_download_files_as_json.mousePressed(() => {object_to_json(membership, 'membership'); object_to_json(constituents, 'constituents')});
    
  });
}

// Function to grab constituents and put them into the local object.
function grab_constituents(output_array){

  return new Promise((resolve, reject) => {
    createP("Fetching data from the Constituents table and adding it to local object.");

    base('Constituents').select({
      // view: "Grid view",
      //fields: ["Constituent ID", "Website", "Birth Country"],
    }).eachPage(
      function page(records, fetchNextPage) {
        records.forEach(function (record) {
          // Pushing constituents semantic and record id to the temp array.

          // localdb_tempdata_constituents.push([record.get('Constituent ID'), record.id, record.get('First Name'), record.get('Last name'), record.get('Website'), record.get('SOIL Link'), record.get('Birth Country'), record.get('Birth City'), record.get('Membership Years'), record.get('Exhibition ID (Artist)'), record.get('Exhibition ID (Curator)'), record.get('Publications (Author)')]);

          output_array.push(
            {
              'record_id': record.id,
              'full_name': record.get('Name'),
              'membership_record_ids': record.get('Membership Years')
            }
          )
       
      });
        fetchNextPage();
      },
      function done(err) {
        if (err) {
          console.error(err);
          reject(err); // Reject the Promise on error
        } else {
          createP("Done fetching data. Grabbed " + constituents.length + " constituents.")
          resolve(); // Resolve the Promise when done

        }
      }
    );
  });
  
}

function grab_membership(output_array){


  return new Promise((resolve, reject) => {
    createP("Fetching data from the Membership table and adding it to local object");

    base('Membership').select({
      // view: "Grid view",
    }).eachPage(
      function page(records, fetchNextPage) {
        records.forEach(function (record) {
          
          //Reference of the constructor method in the object class
          //semantic_id, record_id, exhibition_title, exhibition_url, date_year, date_month, artists_record_ids,curator_record_id
          
          
          // Pushing constituents semantic and record id to the temp array.
          // localdb_tempdata_membership.push([
            
          //     record.get('Name'), 
          //     record.id, 
          //     record.get('Year'), // record id
          //     record.get('Constituents') // record id

            
          //   ]);


          output_array.push(
            {
              'record_id': record.id,
              'year': record.get('Name'),
              'constituents_record_ids': record.get('Constituents')
            }
          )

        });
        fetchNextPage();
      },
      function done(err) {
        if (err) {
          console.error(err);
          reject(err); // Reject the Promise on error
        } else {
          createP("Done fetching data. Grabbed " + membership.length + " memberships.")
          resolve(); // Resolve the Promise when done
        }
      }
    );
  });


}

function object_to_json(object, filename) {
  let json = JSON.stringify(object);

  let writer = createWriter(filename+'_'+month()+'_'+day()+'_'+year()+'.json');
  
  writer.write(json);
  
  writer.close();
}