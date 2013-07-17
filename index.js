var FA = FA || {};
FA.controllers = FA.controllers || {};

FA.controllers.index = function () {
    var viewModel = {
        divisionNames:[
            ["North", "South"],
            ["East", "West"],
            ["Northeast", "Southwest"],
            ["Southeast", "Southwest"],
            ["Southeast", "Northwest"],
            ["Sorth", "Nouth"],
            ["Legends", "Leaders"],
            ["One", "A"],
            ["Applebee's", "Outback"],
            ["Ro*Tel", "Barbasol"],
            ["Let's Have a", "Real Good Time"]
        ],
        prefix:["Western ", "Northern ", "Eastern ", "Southern ", "Northeastern ",
            "Northwestern ", "Southwestern ", "Southeastern "
        ],
        firstSuffix:[" University", " A&M", " Tech", " College", " State"],
        colors:[
            "firebrick", "goldenrod", "orange", "darkorange", "red", "orangered", "green", "blue", "darkred", "maroon", "royalblue", "saddlebrown",
            "crimson", "yellow", "gold"
        ],
        teams:ko.observableArray([]),
        readyLogos:ko.observableArray([]),
        serializer:new XMLSerializer(),
        g:null,
        projection:null,
        width:null,
        height:null,


        drawMap:function () {
            viewModel.width = $(window).width() - 700;
            viewModel.height = 540;

            viewModel.projection = d3.geo.albersUsa()
                .scale(1000)
                .translate([viewModel.width / 2, viewModel.height / 2]);

            var path = d3.geo.path()
                .projection(viewModel.projection);

            var svg = d3.select(".map").append("svg")
                .attr("width", viewModel.width)
                .attr("height", viewModel.height);

            viewModel.g = svg.append("g");



            d3.json("us.json", function (error, us) {
                viewModel.g.insert("path", ".graticule")
                    .datum(topojson.feature(us, us.objects.land))
                    .attr("class", "land")
                    .attr("d", path);

                viewModel.g.insert("path", ".graticule")
                    .datum(topojson.mesh(us, us.objects.counties, function (a, b) {
                    return a !== b && !(a.id / 1000 ^ b.id / 1000);
                }))
                    .attr("class", "county-boundary")
                    .attr("d", path);

                viewModel.g.insert("path", ".graticule")
                    .datum(topojson.mesh(us, us.objects.states, function (a, b) {
                    return a !== b;
                }))
                    .attr("class", "state-boundary")
                    .attr("d", path);



            });

            d3.select(self.frameElement).style("height", viewModel.height + "px");


        },


        getTeamInfos: function (data, numTeams) {
            var teamInfos =[];
            var existantLogos=[];
            var shuffledTeams = _.shuffle(data.teams);
            while(teamInfos.length < numTeams){
                var teamToAdd = shuffledTeams.pop();

                if(teamToAdd.L.length == 0){
                    teamInfos.push(teamToAdd);
                    continue;
                }

                var validLogo = _.find(teamToAdd.L, function(logo){
                    return !_.contains(existantLogos, logo);
                });

                if (validLogo){
                    existantLogos.push(validLogo);
                    teamToAdd.L = [validLogo];
                    teamInfos.push(teamToAdd);
                }


            }

            return teamInfos;

        },

        generate:function () {
            $.getJSON("data.json").success(function (data) {
                var numTeams = 12;
                var places = _.pickRandom(data.places, numTeams);
                var teamInfos = viewModel.getTeamInfos(data, numTeams);
                var id = 0;
                var institutions = _.map(places, function (place) {
                    var team = {
                        name:"",
                        teamName:"",
                        rawLogo:ko.observable(),
                        id:id++
                    };
                    var hasPrefix = false;
                    if (Math.random() > .5) {
                        hasPrefix = true;
                        team.name += _.pickRandom(viewModel.prefix, 1);
                    } else if (Math.random() > .5) {
                        team.name += "University of ";
                    }

                    team.name += place.N;
                    team.lat = place.Lat;
                    team.lon = place.Lon;

                    var teamInfo = teamInfos.pop();

                    team.teamName = teamInfo.N;

                    if (team.name.indexOf("University") < 0) {

                        var suffixes = viewModel.firstSuffix.slice();

                        if (!hasPrefix) {
                            suffixes.push(" Institute of Technology");
                            suffixes.push(" State University");
                        }

                        team.name += _.pickRandom(suffixes, 1);

                        if (Math.random() > .5) {
                            team.logoLetter = team.name[0];
                        } else {
                            var placeNameArray = team.name.split(" ");
                            team.logoLetter = _.reduce(placeNameArray, function (memo, word) {

                                if (word === "" || word === "of" || word === "A&M") {
                                    return memo;
                                }

                                return memo.concat(word[0]);
                            }, "")
                        }


                    } else {
                        var placeNameArray = place.N.split(" ");
                        if (placeNameArray.length > 1) {
                            team.logoLetter = _.reduce(placeNameArray, function (memo, word) {
                                if (word === "" || word === "of") {
                                    return memo;
                                }
                                return memo.concat(word[0]);
                            }, "U")

                        } else {
                            team.logoLetter = place.N[0];
                        }
                    }


                    if (teamInfo.C !== "") {
                        team.teamColor = teamInfo.C;
                    } else {
                        team.teamColor = _.pickRandom(viewModel.colors, 1);
                    }


                    if (teamInfo.L.length !== 0) {
                        d3.xml(teamInfo.L + ".svg", "image/svg+xml", function (xml) {
//                        d3.xml("bandit.svg", "image/svg+xml", function (xml) {
                            var importedNode = document.importNode(xml.documentElement, true);

                            var svg = d3.select(importedNode);

                            svg.attr("id", "logo" + team.id).attr("class", "logo");


                                svg
                                    .selectAll("path")
                                    .attr("transform", "scale(.10)");



                            svg
                                .selectAll(".color")
                                .attr("fill", team.teamColor);


                            team.rawLogo(viewModel.serializer.serializeToString(importedNode));

                            viewModel.readyLogos.push(team.id);

                        });


                    } else {

                        var textLogoTemplate = _.template('<svg class="logo" id="logo<%= id %>" width="150" height="50"><text font-family="<%= font %>"  text-anchor="middle" x="50%" y="50%" dy=".3em" font-size="<%= fontSize %>" class="<%= bold%><%= italics%>" fill="<%= color %>" <%= stroke %>><%= letter %></text></svg>');

                        var font = (Math.random() > .5) ? "Holtwood One SC" : "Graduate";

                        var bold = (Math.random() > .55) ? " logoBold " : "";

                        var italics = (Math.random() > .55) ? " logoItalics " : "";

                        var useTeamName = (Math.random() > .70);

                        var text;

                        if (useTeamName) {
                            text = (Math.random() > .65) ? team.teamName : team.teamName.toUpperCase();
                        } else {
                            text = team.logoLetter;
                        }


                        var fontSize = useTeamName ? (57.0553 + (-17.51654547 * Math.log(text.length))) : 33;

                        var stroke = "";


                        if (Math.random() > .33 && font !== "Graduate") {
                            var color = (Math.random() > .5) ? "white" : "black";
                            stroke = 'stroke="' + color + '" stroke-width="1.25"';
                        }

                        team.rawLogo(textLogoTemplate({
                            id:team.id,
                            font:font,
                            color:team.teamColor,
                            letter:text,
                            stroke:stroke,
                            bold:bold,
                            fontSize:fontSize,
                            italics:italics
                        }));

                        viewModel.readyLogos.push(team.id);
                    }


                    return team;
                })

                viewModel.teams(institutions);


            });
        },

        logoRenderLoop:function () {


            var done = false;

            function waitForLogoRendering() {
                setTimeout(function () {
                    done = $(".logo").length === 12 && viewModel.readyLogos().length === 12;
                    if (!done) {
                        waitForLogoRendering();
                    } else {
                        viewModel.addLogos();
                    }

                }, 1500)
            }

            waitForLogoRendering();
        },

        addLogos:function () {



            var nodes = viewModel.g.append("g")
                .attr("class", "nodes")
                .selectAll("g")
                .data(viewModel.teams())
                .enter()
                .append("g")
                .attr("class", "node")
                .attr("id", function (d) {
                    return "mapLogo" + d.id;
                })




            _.each(viewModel.readyLogos(), function (teamId) {
                $("#logo" + teamId).children().clone().removeAttr("x").removeAttr("y").removeAttr("transform").appendTo("#mapLogo" + teamId);
            });


            nodes.each(function (datum) {
                var node = d3.select(this);

                node.select("text")
                    .attr("transform", function (d, i) {
                        var coords = viewModel.projection([node[0][0].__data__.lon, node[0][0].__data__.lat]);
                        d.x = coords[0],
                        d.y = coords[1];
                        return "translate(" + d.x + "," + d.y + ")";
                    })

                node.select("g")
                    .attr("transform", function (d, i) {
                        var coords = viewModel.projection([node[0][0].__data__.lon, node[0][0].__data__.lat]);
                        d.x = coords[0] - 25,
                        d.y = coords[1] - 25;
                        return "translate(" + d.x + "," + d.y + ")";
                    })

            });

            var bounds = d3.selectAll(".nodes")[0][0].getBBox();


            var lowerLeft = [bounds.x , bounds.y ];
            var upperRight = [bounds.x + bounds.width, bounds.y + bounds.height];

            var b = [lowerLeft, upperRight];

            viewModel.g.transition().attr("transform",
                "translate(" + viewModel.projection.translate() + ")"
                    + "scale(" + .90 / Math.max((b[1][0] - b[0][0]) / viewModel.width, (b[1][1] - b[0][1]) / viewModel.height) + ")"
                    + "translate(" + -(b[1][0] + b[0][0]) / 2 + "," + -(b[1][1] + b[0][1]) / 2 + ")");


        }

    }


    var initialize = function () {
        viewModel.drawMap();

        viewModel.generate();

        ko.applyBindings(viewModel);


        viewModel.logoRenderLoop();


    }

    return {
        initialize:initialize
    };
};