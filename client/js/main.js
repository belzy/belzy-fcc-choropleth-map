(function() {

    const getData = done => {

        const cacheName = 'belzy-fcc-choropleth-data-cache';
        const cacheExpiry = 1800000; // 30 minutes in milliseconds
        const currentTime = new Date().getTime();
        let cache = JSON.parse(localStorage.getItem(cacheName));
        const resources = [
            'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json',
            'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json'
        ]
        const init = {
            method: 'GET',
        };

        // If data is not cached or is expired, request and cache new data.
        if (cache === null || cache['expiration'] <= currentTime) {

            if (cache === null) console.log('Cache doesn\'t exist. Creating new cache...');
            else if (cache['expiration'] <= currentTime) console.log('Cache has expired. Updating cache...');

            fetch(resources[0], init)
            .then(responseOne => responseOne.json())
            .then(responseOne => {
                fetch(resources[1], init)
                    .then(responseTwo => responseTwo.json())
                    .then(responseTwo => {

                        cache = {
                            expiration: currentTime + cacheExpiry,
                            data: [responseOne, responseTwo]
                        };

                        localStorage.setItem(cacheName, JSON.stringify(cache));

                        done([responseOne, responseTwo])
                    })
                    .catch(err => console.log(err));
            }).catch(err => console.log(err));      

        } else {

            console.log('Using cached data...');
            done([cache['data'][0], cache['data'][1]]);

        }


        

        

        

    }

    getData(dataArr => {

        // console.log(dataArr);

        const fipsArr = dataArr[0].map(({ fips }) => fips);
        // console.log(fipsArr);

        const countyIdArr = dataArr[1]['objects']['counties']['geometries'].map(({ id }) => id).sort((a, b) => a - b);
        // console.log(countyIdArr);


        const countyEduData = dataArr[0];
        const topology = dataArr[1];
        
        console.log(countyEduData);


        const nationGeoJson = topojson.feature(topology, topology['objects']['nation']);
        const stateGeoJson = topojson.feature(topology, topology['objects']['states']);
        const countyGeoJson = topojson.feature(topology, topology['objects']['counties']);
        // console.log(nationGeoJson);
        
        
        // Sort counties by ascending id.
        countyGeoJson['features'].sort((a, b) => {
            
            if (a.id <= b.id) return -1;
            else if (b.id < a.id) return 0;
            
        });
        
        
        
        // Add each county's education data to counties properties object
        countyGeoJson.features.forEach(({ properties }, i) => {
            properties = { ...countyEduData[i] }
        });

        console.log(countyGeoJson.features);
        
        const w = 1200;
        const h = 600;

        // Define map projection
        // const projection = d3.geoAlbersUsa()
            // .translate([w / 2, h / 2]).scale([500]);

        // Define default path generator
        const path = d3.geoPath()
            // .projection(projection);

        const svg = d3.select('#svg-choropleth-map')
            .attr('width', w)
            .attr('height', h)


        const colorScale = d3.scaleQuantile()
            .range(["rgb(237, 248, 233)", "rgb(186, 228, 179)", "rgb(116,196,118)", "rgb(49,163,84)", "rgb(0,109,44)"]);

            // svg.selectAll('path')
            //     .data(nationGeoJson.features)
            //     .enter()
            //     .append('path')
            //     .attr('d', d => {
            //         console.log(d)
            //         return path(d);
            //     })

            

            svg.selectAll('.county')
                .data(countyGeoJson.features)
                .enter()
                .append('path')
                .attr('class', 'county')
                .attr('fill', 'red')
                .attr('d', path)

            svg.selectAll('.state')
                .data(stateGeoJson.features)
                .enter()
                .append('path')
                .attr('class', 'state')
                .attr('fill', 'none')
                .attr('stroke', 'white')
                .attr('d', path)


    });

})();