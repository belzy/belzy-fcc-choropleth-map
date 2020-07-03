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

        const countyEduData = dataArr[0];
        const topology = dataArr[1];
        console.log(topology)

        const bbox = topology['bbox'];
        const transform = topology['transform'];
        
        const nationGeoJson = topojson.feature(topology, topology['objects']['nation']);
        const stateGeoJson = topojson.feature(topology, topology['objects']['states']);
        const countyGeoJson = topojson.feature(topology, topology['objects']['counties']);
        
        // Sort counties by ascending id.
        countyGeoJson['features'].sort((a, b) => {
            
            if (a.id <= b.id) return -1;
            else if (b.id < a.id) return 0;
            
        });
        
        // Add each county's education data to counties properties object
        countyGeoJson.features.forEach((obj, i) => {
            countyGeoJson.features[i].properties = { ...countyEduData[i] }
        });

        // Get min/max percentages.
        // const percentages = countyEduData.map(({bachelorsOrHigher}) => bachelorsOrHigher);
        const minPercent = d3.min(countyEduData, ({bachelorsOrHigher}) => bachelorsOrHigher);
        const maxPercent = d3.max(countyEduData, ({bachelorsOrHigher}) => bachelorsOrHigher);
        console.log(minPercent, maxPercent);

        const w = 1200;
        const h = 740;

        // Color Scale
        colorsArr = [/*'#F7FBFF', '#DEEBF7', '#C6DBEF', */'#9ECAE1', '#6BAED6', '#4292C6', '#2171B5', '#2171B5', '#08519C', '#08306B'];
        const scaleColor = d3.scaleQuantize();
        scaleColor.domain([minPercent, maxPercent]).range(colorsArr);

        // Define map projection
        // const projection = d3.geoAlbersUsa()
            // .translate([transform['translate'][0], transform['translate'][1]])//.scale([transform['scale'][0], transform['scale'][1]]);

        // Define default path generator
        const path = d3.geoPath()
            // .projection(projection);

        const svg = d3.select('#svg-choropleth-map')
            .attr('width', w)
            .attr('height', h)
        
        const g = svg.append('g')
            .attr('transform', `translate(125, 100)`)
            

            // svg.selectAll('path')
            //     .data(nationGeoJson.features)
            //     .enter()
            //     .append('path')
            //     .attr('d', d => {
            //         console.log(d)
            //         return path(d);
            //     })

            g.selectAll('.county')
                .data(countyGeoJson.features)
                .enter()
                .append('path')
                .attr('class', 'county')
                .attr('fill', (d, i) => scaleColor(d['properties']['bachelorsOrHigher']))
                .attr('d', path)
                .attr('data-area-number', (d, i) => i)
                .attr('data-fips', (d, i) => d['properties']['fips'])
                .attr('data-education', (d, i) => d['properties']['bachelorsOrHigher'])
                .on('mouseenter', (d, i) => {

                    const properties = d['properties'];
                    const tooltipData = `${properties['area_name']}, ${properties['state']}: ${properties['bachelorsOrHigher']}%`;

                    // console.log(`${properties['area_name']}, ${properties['state']}`)

                    // rect.top, rect.right, rect.bottom, rect.left
                    const cellRect = document.querySelector(`[data-area-number="${i}"]`).getBoundingClientRect();

                    const topOffset = -15;
                    const leftOffset = 10;

                    d3.select('#tooltip')
                        .attr('data-education', () => countyGeoJson.features[i]['properties']['bachelorsOrHigher'])
                        .style('top', `${cellRect.top + ((cellRect.bottom - cellRect.top) / 2) + topOffset}px`)
                        .style('left', `${cellRect.right + leftOffset}px`)
                        .style('opacity', '0.7')
                        // .attr('data-year', dataset[i]['year'])

                    d3.select('#tooltip-data')
                        .text(tooltipData)
                })
                .on('mouseout', (d, i) => {
                    d3.select('#tooltip')
                        .style('opacity', '0.0')
                })

            g.selectAll('.state')
                .data(stateGeoJson.features)
                .enter()
                .append('path')
                .attr('class', 'state')
                .attr('fill', 'none')
                .attr('stroke', 'white')
                .attr('d', path)


    });

})();