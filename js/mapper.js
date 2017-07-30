

/**************************************************************************************
 
      TSPTW optimized multipoint router with bridge restriction avoidance 
      functionality, proof of concept built for KesLog on Google Maps™
            
      Status: under construction
 
      Created by Tero Hannula, 24.2.2014 ->
 
 *************************************************************************************/


/*
 * Parannusajatuksia:
 * 
 * - kaikki markkerit togglattaviksi (asiakkaat kesken, muut tehty)
 * - suuntanuolia reittiviivaan (tehty)
 * - asiakkaan sijainnin muutos markkeria vetämällä silloin kun reittieditointi-ikkuna on auki (tehty)
 * 
 * - asiakkaan osoite yhteen kenttään
 * - suorakäsittelyllä tehdyn muutoksen tallentaminen osaksi reittiä ja autokohtaisesti
 * - asiakkaan infoikkunaan osoitetiedot aikaikkunoineen ja Street view -kuva lähestymissuunnasta
 * - asiakkaan sijainti perustuisi aina latlng-tietoon eikä katuosoitteeseen
 * - asiakkaiden tietojen syöttäminen/etsiminen paremmaksi (esim. id tai sen osastringi esitäyttää kaiken)
 * - reittiviivaa klikatessa näkyy Street view -kuva juuri siitä kohtaa ja reitin suuntaan katsottuna (rightclick)
 * - koko hallintapaneeli togglattavaksi
 * - terminaaliin liittyvien reittien näyttäminen reittivalikossa terminaalimerkkeria klikkaamalla
 * 
 * 
 */


// moduuli

var keslog_module = angular.module('keslog', ['ngSanitize', 'ui.bootstrap', 'ngAnimate']);



// vakiot

var max_weight_on_road = 76000; // suurin sallittu paino Suomen teillä
var max_height_on_road = 4.4;   // korkein sallittu muu kuin erikoiskuljetus Suomen teillä
var api_key="AIzaSyDJJt10_HIuam5MQ2H6dorY3uzsvVbnNCI"; // ei käytetä mihinkään
var image_path = "kuvat/";
var tw_under_work = false;
var arrows_polyline;
//var routetrigger_watch_enabled = true;


// Kontrollerit

keslog_module.controller("mapCtrl", ['$scope', function($scope) {

        $scope.directionsDisplay;
        $scope.directionsService;
        $scope.map;
        $scope.optimize_tsp = true;
        $scope.optimize_tw = false;
        $scope.bridges = [];
        //$scope.current_routes;
        $scope.traffic = false;
        
        $scope.editroutewindowOpen = false;
        $scope.image_path = "kuvat/";
        
        /*$scope.$watch('selectedrouteindex', function(newVal, oldVal) {
            console.log("MUUTOS: uusi="+newVal+", vanha="+oldVal);
        });*/
        
        
        
        // tehdään kartta ja laitetaan se map-canvas -diviin
        
        var mapDiv = document.getElementById('map-canvas');
        $scope.map = new google.maps.Map(mapDiv, {
            center: new google.maps.LatLng(60.190234970864, 24.89031314844),
            zoom: 11,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: true,
            mapTypeControlOptions: {
                position: google.maps.ControlPosition.TOP_CENTER
            },
        });

        google.maps.visualRefresh = true;
        
        // tehdään reittiviivasta suorakäsiteltävä
        
        $scope.RendererOptions = {
            draggable: false,
            clickable: true,
            suppressMarkers: false
        };

        // pystytetään reititykseen ja reitin visualisointiin tarvittavat lisäkilkkeet
        
        $scope.directionsService = new google.maps.DirectionsService;
        $scope.directionsDisplay = new google.maps.DirectionsRenderer($scope.RendererOptions);
        $scope.directionsDisplay.setMap($scope.map);
 
        // Tehdään traffic layer, näkyviin laitto tapahtuu funktionssa setTrafficLayer()
        
        $scope.trafficLayer = new google.maps.TrafficLayer();
        if($scope.traffic === true) {
        	$scope.trafficLayer.setMap($scope.map);
        }
        	
        // lisätään maastoon yksi nuoli esim. näyttämään missä on asiakkaan purkualue
        
        $scope.arrowLayer = new google.maps.GroundOverlay("kuvat/arrow.png", new google.maps.LatLngBounds(new google.maps.LatLng(60.44329002166061, 22.358050691426797), new google.maps.LatLng(60.44333765296912, 22.358125793279214)));
        $scope.arrowLayer.setOpacity(0.7);
        $scope.arrowLayer.setMap($scope.map);
        
        // tehdään esimerkkisilta ja laitetaan se siltataulukkoon
        
        var bridge1 = new google.maps.Marker({
            position: new google.maps.LatLng(60.16606094873299, 24.891330558599066),
            map: $scope.map,
            draggable: false,
            type: "bridge",
            weight_limit: 12000,
            height_limit: 0,
            optimized: false,
            callback: null,
            icon: {
                url: 'kuvat/bridge.png'
            }
        });   
        $scope.bridges.push(bridge1);

        // tehdään esimerkkisilta ja laitetaan se siltataulukkoon
        
        var bridge2 = new google.maps.Marker({
            position: new google.maps.LatLng(60.16695367399583, 24.838536130727334),
            map: $scope.map,
            draggable: false,
            type: "bridge",
            weight_limit: 15000,
            height_limit: 0,
            optimized: false,
            callback: null,
            icon: {
                url: 'kuvat/bridge.png'
            }
        });
        $scope.bridges.push(bridge2);

        // tehdään esimerkkisilta ja laitetaan se siltataulukkoon
        
        var bridge3 = new google.maps.Marker({
            position: new google.maps.LatLng(60.46154357366547, 22.199108349622293),  
            map: $scope.map,
            draggable: false,
            type: "bridge",
            weight_limit: 0,
            height_limit: 2.6,
            optimized: false,
            callback: null,
            icon: {
                url: 'kuvat/bridge.png'
            }
        });
        $scope.bridges.push(bridge3);

        // tehdään esimerkkisilta ja laitetaan se siltataulukkoon
        
        var bridge4 = new google.maps.Marker({
            position: new google.maps.LatLng(60.481196331613916, 22.184843020976587),
            map: $scope.map,
            draggable: false,
            type: "bridge",
            weight_limit: 9000,
            height_limit: 0,
            optimized: false,
            callback: null,
            icon: {
                url: 'kuvat/bridge.png'
            }
        });
        $scope.bridges.push(bridge4);
        
        var bridge5 = new google.maps.Marker({
            position: new google.maps.LatLng(60.466391606087704, 22.12314014369349),
            map: $scope.map,
            draggable: false,
            type: "bridge",
            weight_limit: 12000,
            height_limit: 0,
            optimized: false,
            callback: null,
            icon: {
                url: 'kuvat/bridge.png'
            }
        });
        $scope.bridges.push(bridge5);

        
        // tehdään siltamarkkereille click-kuuntelija, joka togglaa infoikkunaa
        
        	
        $scope.add_click_listener = function(marker) {
        	
        	        	
        	var infotext = "<div id='infowindowdiv'><span class='infowindowheader'>Siltarajoitus</span>";
        	if(marker.weight_limit > 0) {
        		infotext += "<span class='infowindowtext'>Painorajoitus "+marker.weight_limit+" kg<span>";
        	}
    		if(marker.height_limit > 0) {
    			infotext += "<span class='infowindowtext'>Korkeusrajoitus "+marker.height_limit+" m</span>";
    		}
    		infotext += "</div>";
    		
        	var func = function() {
        		
        		// jos infoWindow on jo auki, suljetaan se

        		if(this.infowindow !== undefined && this.infowindow.is_open === true) {
        			this.infowindow.is_open = false;
        			this.infowindow.close();
        			return;
        		}
        		
        		// tämä infoWindow aukeaa kun markkeria klikataan
        		// asdf
        		this.infowindow = new google.maps.InfoWindow({
        			maxWidth: 300,
        			content: infotext,
        			is_open: false
        		});
        		
        		// lisätään kuuntelija infoWindown close-napille, jotta toggle toimii sen 
        		// painamisen jälkeenkin oikein (eli is_open vaihtuu falseksi)
        		
        		google.maps.event.addListener(this.infowindow,'closeclick',function(){
        			this.is_open = false;
        			this.close();
        		});
        		
        		this.infowindow.is_open = true;
        		this.infowindow.open($scope.map, marker);
        	}
        	
        	// asetetaan yo. funktio markkeriin callback-funktioksi kun markkeria klikataan
        	marker.callback = func;
        	
        	// aseta klikkausten kuuntelija, joka triggaa callbackin markkerista
        	google.maps.event.addListener(marker, 'click', func);

        };
        
        
        for(var i = 0; i < $scope.bridges.length; i++) {
        	
        	$scope.add_click_listener($scope.bridges[i]);
        }
        
        
        
        
     // tämä on siirreltävä koordinaattienhakumarkkeri, tulostaa koordinaattinsa console.logiin
        
        if(false) {
            var marker = new google.maps.Marker({
                position: new google.maps.LatLng(60.20606094873299, 24.921330558599066),
                map: $scope.map,
                draggable: true,
                title: "Paikanhakumerkkeri",
                crossOnDrag: false,
                type: "marker",
                weight_limit: 0,
                height_limit: 0,
                optimized: false
            });
            $scope.bridges.push(marker);
            // markkerin siirtelykuuntelija, tulostaa koordinaatit konsoliin kun raahaaminen päättyy
            google.maps.event.addListener(marker, 'dragend', function()
            {
                marker_pos = marker.getPosition();
                console.log(""+marker_pos.lat()+" "+marker_pos.lng());
            });
        }
        
        

                
        
     // autot, demokäyttöä varten
        
        $scope.cars = [];
        $scope.cars.push({
                id: 100,
                weight: 14000,
                height: 3.6
               });
        
        $scope.cars.push({
               id: 142,
               weight: 4000,
               height: 2.8
               });
        
        
        /*$scope.cars = new Object();
        
        $scope.cars["100"] = {
             id: 100,
             weight: 14000,
             height: 3.6
            };
        $scope.cars["142"] = {
            id: 142,
            weight: 4000,
            height: 2.8
            };*/
        
            
        
        // Luetaan reitit tallennuspaikasta; jos listaa ei ole tai se on tyhjä käytetään kovakoodattua versiota
        
        $scope.delivery_routes = JSON.parse(localStorage.getItem("keslog_routes"));
        
        if($scope.delivery_routes === null || $scope.delivery_routes === undefined || $scope.delivery_routes.length == 0) {
        	console.log("Reittejä ei ollut localStoragessa, generoidaan oletusreitit uudelleen...");
        	$scope.delivery_routes = [        
        	{
        	    terminal_address: "Avantintie 29, 21420 Lieto, Finland",
                id: "301046",
                terminal_icon: "keslog_icon.png",
                description: "Naantali-Masku",
                route: null,				// directionsResult-objekti, laskettu reitti laitetaan tänne talteen
                waypoint_order: [],			// directionsResult-objektin waypoint_order-taulukko, laitetaan talteen tähän
                car_ready_time: new Date(),
                earliest_start_time: "",	// lähtöaikahaarukan alkupää TSPTW-optimissa reitissä
                latest_start_time: "",
                car_id: 100,
                customers: []
            },
            {
            	terminal_address: "Avantintie 29, 21420 Lieto, Finland",
                id: "301071", 
                terminal_icon: "keslog_icon.png",
                description: "Turku-Kaarina-Lieto",
                route: null,				// directionsResult-objekti, laskettu reitti laitetaan tänne talteen
                waypoint_order: [],			// directionsResult-objektin waypoint_order-taulukko, laitetaan talteen tähän
                car_ready_time: new Date(),
                earliest_start_time: "",
                latest_start_time: "",		// lähtöaikahaarukan myöhempi pää TSPTW-optimissa reitissä
                car_id: 142,
                customers: []
            },
            {
            	terminal_address: "Avantintie 29, 21420 Lieto, Finland",
                id: "301012",
                terminal_icon: "keslog_icon.png",
                description: "Turku-Piikkiö",
                route: null,				// directionsResult-objekti, laskettu reitti laitetaan tänne talteen
                waypoint_order: [],			// directionsResult-objektin waypoint_order-taulukko, laitetaan talteen tähän
                car_ready_time: new Date(),
                earliest_start_time: "",
                latest_start_time: "",		// lähtöaikahaarukan myöhempi pää TSPTW-optimissa reitissä
                car_id: 100,
                customers: []
            },
            {
            	terminal_address: "Avantintie 29, 21420 Lieto, Finland",
                id: "611002",
                terminal_icon: "keslog_icon.png",
                description: "Naantali-Piikkiö, pitkä",
                route: null,				// directionsResult-objekti, laskettu reitti laitetaan tänne talteen
                waypoint_order: [],			// directionsResult-objektin waypoint_order-taulukko, laitetaan talteen tähän
                car_ready_time: new Date(),
                earliest_start_time: "",
                latest_start_time: "",		// lähtöaikahaarukan myöhempi pää TSPTW-optimissa reitissä
                car_id: 100,
                customers: []
            }];
        
        	// kellonaikoja edelliseen taulukkoon
        
        	$scope.delivery_routes[0].car_ready_time.setHours(5);
        	$scope.delivery_routes[0].car_ready_time.setMinutes(0);
        	$scope.delivery_routes[1].car_ready_time.setHours(16);
        	$scope.delivery_routes[1].car_ready_time.setMinutes(0);
        	$scope.delivery_routes[2].car_ready_time.setHours(2);
        	$scope.delivery_routes[2].car_ready_time.setMinutes(0);
        	$scope.delivery_routes[3].car_ready_time.setHours(6);
        	$scope.delivery_routes[3].car_ready_time.setMinutes(0);
        
        	// ajokohteet
            
            $scope.delivery_routes[0].customers = [
                {
                    id: "038-041",
            	    name: "K-EXTRA RUUSUMO",
            	    address: "Merimaskuntie 101",
            	    post_code: "21160",
            	    city: "MERIMASKU",
            	    route_number: "301046",
            	    infowindow_callback: null,	// asiakasmarkkerin klikkaaminen suorittaa tämän funtion
              	    arrive_from: new Date(),	// saa saapua aikaisintaan tähän aikaan
              	    arrive_to: new Date(),		// pitää häipyä tontilta viimeistään tähän aikaan
              	    duration: 19				// purku kestää tämän verran
                },
                {
                    id: "938-222",
            	    name: "TERVEYSKESKUKSEN KEITTIÖ",
            	    address: "Tuulensuunkatu 6",
            	    post_code: "21100",
            	    city: "Naantali",
            	    route_number: "301046",
            	    infowindow_callback: null,
              	    arrive_from: new Date(),
              	    arrive_to: new Date(),
              	    duration: 11
                },
                {
                    id: "038-024",
            	    name: "K-MARKET ETAPPI",
            	    address: "NUHJALANTIE 8",
            	    post_code: "21110",
            	    city: "NAANTALI",
            	    route_number: "301046",
            	    infowindow_callback: null,
              	    arrive_from: new Date(),
              	    arrive_to: new Date(),
              	    duration: 18
                }, 
                {
                    id: "938-006",
            	    name: "NAANTALIN KYLPYLÄ, ALKOHOLI",
            	    address: "MATKAILIJANTIE 2",
            	    post_code: "21100",
            	    city: "NAANTALI",
            	    route_number: "301046",
            	    infowindow_callback: null,
              	    arrive_from: new Date(),
              	    arrive_to: new Date(),
              	    duration: 10
                },
                {
                    id: "938-017",
            	    name: "NAANTALIN KYLPYLÄ, KEITTIÖ",
            	    address: "Matkailijantie 2",
            	    post_code: "21100",
            	    city: "Naantali",
            	    route_number: "301046",
            	    infowindow_callback: null,
              	    arrive_from: new Date(),
              	    arrive_to: new Date(),
              	    duration: 10
                },
                {
                    id: "938-018",
            	    name: "NAANTALIN AMMATTIOPISTO",
            	    address: "EMÄNNÄNKATU 5",
            	    post_code: "21100",
            	    city: "NAANTALI",
            	    route_number: "301046",
            	    infowindow_callback: null,
              	    arrive_from: new Date(),
              	    arrive_to: new Date(),
              	    duration: 13
                },
                {
                    id: "033-175",
            	    name: "K-MARKET MASKU",
            	    address: "KESKUSKAARI 5",
            	    post_code: "21250",
            	    city: "MASKU",
            	    route_number: "301046",
            	    infowindow_callback: null,
              	    arrive_from: new Date(),
              	    arrive_to: new Date(),
              	    duration: 22
                } ];
            
            $scope.delivery_routes[1].customers = [
            
                {
                    id: "062-024",
            	    name: "K-MARKET ILPOINEN",
            	    address: "LAUKLÄHTEENKATU 10",
            	    post_code: "20740",
            	    city: "TURKU",
            	    route_number: "301071",
            	    infowindow_callback: null,
              	    arrive_from: new Date(),
              	    arrive_to: new Date(),
              	    duration: 21
                },
                {
                    id: "200-124",
            	    name: "K-SUPERMARKET KATARIINA",
            	    address: "Hovirinnantie 5",
            	    post_code: "20780",
            	    city: "KAARINA",
            	    route_number: "301071",
            	    infowindow_callback: null,
              	    arrive_from: new Date(),
              	    arrive_to: new Date(),
              	    duration: 19
                },
                {
                    id: "200-185",
            	    name: "K-CITYMARKET TURKU SKANSSI",
            	    address: "Itäkaari 20",
            	    post_code: "20750",
            	    city: "TURKU",
            	    route_number: "301071",
            	    infowindow_callback: null,
              	    arrive_from: new Date(),
              	    arrive_to: new Date(),
              	    duration: 18
                },
                {
                    id: "200-128",
            	    name: "K-CITYMARKET TURKU RAVATTULA",
            	    address: "Reivikatu 5-7",
            	    post_code: "20540",
            	    city: "TURKU",
            	    route_number: "301071",
            	    infowindow_callback: null,
              	    arrive_from: new Date(),
              	    arrive_to: new Date(),
              	    duration: 18
                },
                {
                    id: "200-149",
            	    name: "K-SUPERMARKET LIETO",
            	    address: "Hyvättyläntie 2",
            	    post_code: "21420",
            	    city: "LIETO",
            	    route_number: "301071",
            	    infowindow_callback: null,
              	    arrive_from: new Date(),
              	    arrive_to: new Date(),
              	    duration: 18
                },
                {
                    id: "960-419",
            	    name: "CM KUPITTAA",
            	    address: "Uudenmaantie 17",
            	    post_code: "20700",
            	    city: "TURKU",
            	    route_number: "301071",
            	    infowindow_callback: null,
              	    arrive_from: new Date(),
              	    arrive_to: new Date(),
              	    duration: 10
                } ];
            
            $scope.delivery_routes[2].customers = [
            
                {
                    id: "062-049",
            	    name: "K-MARKET UITTAMO",
            	    address: "Ratsumiehenkatu 8",
            	    post_code: "20880",
            	    city: "TURKU",
            	    route_number: "301012",
            	    infowindow_callback: null,
              	    arrive_from: new Date(),
              	    arrive_to: new Date(),
              	    duration: 19
                },
                {
                    id: "200-108",
            	    name: "K-SUPERMARKET ANNIKA",
            	    address: "Annikanpolku 1",
            	    post_code: "20610",
            	    city: "TURKU",
            	    route_number: "301012",
              	    arrive_from: new Date(),
              	    arrive_to: new Date(),
              	    duration: 19
                },
                {
                    id: "200-138",
            	    name: "K-SUPERMARKET PIIKKIÖ",
            	    address: "Lukkarintie 2",
            	    post_code: "21500",
            	    city: "PIIKKIÖ",
            	    route_number: "301012",
            	    infowindow_callback: null,
              	    arrive_from: new Date(),
              	    arrive_to: new Date(),
              	    duration: 13
                },
                {
                    id: "960-103",
            	    name: "MÄNTYMÄEN RAVINTOKESKUS",
            	    address: "Luolavuorentie 2",
            	    post_code: "20700",
            	    city: "TURKU",
            	    route_number: "301012",
            	    infowindow_callback: null,
              	    arrive_from: new Date(),
              	    arrive_to: new Date(),
              	    duration: 14
                },
                {
                    id: "968-023",
            	    name: "K-YLIOPPILASKYLÄNVALINTA",
            	    address: "Inspehtorinkatu 4",
            	    post_code: "20540",
            	    city: "TURKU",
            	    route_number: "301012",
            	    infowindow_callback: null,
              	    arrive_from: new Date(),
              	    arrive_to: new Date(),
              	    duration: 15
                } ]; 
                
                $scope.delivery_routes[3].customers = [
                {
                	id: "038-041",
                    name: "K-EXTRA RUUSUMO",
                    address: "Merimaskuntie 101",
                    post_code: "21160",
                    city: "MERIMASKU",
                    route_number: "611002",
                    infowindow_callback: null,
                    arrive_from: new Date(),	// saa saapua aikaisintaan tähän aikaan
                    arrive_to: new Date(),		// pitää häipyä tontilta viimeistään tähän aikaan
                    duration: 19				// purku kestää tämän verran
                },
                {
                	id: "938-222",
                	name: "TERVEYSKESKUKSEN KEITTIÖ",
                	address: "Tuulensuunkatu 6",
                	post_code: "21100",
                	city: "Naantali",
                	route_number: "611002",
                	infowindow_callback: null,
                	arrive_from: new Date(),
                	arrive_to: new Date(),
                	duration: 11
                },
                {
                	id: "038-024",
                    name: "K-MARKET ETAPPI",
                    address: "NUHJALANTIE 8",
                    post_code: "21110",
                    city: "NAANTALI",
                    route_number: "611002",
                    infowindow_callback: null,
                    arrive_from: new Date(),
                    arrive_to: new Date(),
                    duration: 18
                }, 
                {
                    id: "938-006",
                    name: "NAANTALIN KYLPYLÄ, ALKOHOLI",
                    address: "MATKAILIJANTIE 2",
                    post_code: "21100",
                    city: "NAANTALI",
                    route_number: "611002",
                    infowindow_callback: null,
                    arrive_from: new Date(),
                    arrive_to: new Date(),
                    duration: 10
                    },
               {
                    id: "938-017",
                    name: "NAANTALIN KYLPYLÄ, KEITTIÖ",
                    address: "Matkailijantie 2",
                    post_code: "21100",
                    city: "Naantali",
                    route_number: "611002",
                    infowindow_callback: null,
                    arrive_from: new Date(),
                    arrive_to: new Date(),
                    duration: 10
               },
               {
                    id: "938-018",
                    name: "NAANTALIN AMMATTIOPISTO",
                    address: "EMÄNNÄNKATU 5",
                    post_code: "21100",
                    city: "NAANTALI",
                    route_number: "611002",
                    infowindow_callback: null,
                    arrive_from: new Date(),
                    arrive_to: new Date(),
                    duration: 13
               },
               {
                    id: "033-175",
                    name: "K-MARKET MASKU",
                    address: "KESKUSKAARI 5",
                    post_code: "21250",
                    city: "MASKU",
                    route_number: "611002",
                    infowindow_callback: null,
                    arrive_from: new Date(),
                    arrive_to: new Date(),
                    duration: 22
               },
               {
                    id: "062-049",
                    name: "K-MARKET UITTAMO",
                    address: "Ratsumiehenkatu 8",
                    post_code: "20880",
                    city: "TURKU",
                    route_number: "611002",
                    infowindow_callback: null,
                    arrive_from: new Date(),
                    arrive_to: new Date(),
                    duration: 19
               },
               {
                    id: "200-108",
                    name: "K-SUPERMARKET ANNIKA",
                    address: "Annikanpolku 1",
                    post_code: "20610",
                    city: "TURKU",
                    route_number: "611002",
                    infowindow_callback: null,
                    arrive_from: new Date(),
                    arrive_to: new Date(),
                    duration: 19
               },
               {
                    id: "200-138",
                    name: "K-SUPERMARKET PIIKKIÖ",
                    address: "Lukkarintie 2",
                    post_code: "21500",
                    city: "PIIKKIÖ",
                    route_number: "611002",
                    infowindow_callback: null,
                    arrive_from: new Date(),
                    arrive_to: new Date(),
                    duration: 13
               },
               {
                    id: "960-103",
                    name: "MÄNTYMÄEN RAVINTOKESKUS",
                    address: "Luolavuorentie 2",
                    post_code: "20700",
                    city: "TURKU",
                    route_number: "611002",
                    infowindow_callback: null,
                    arrive_from: new Date(),
                    arrive_to: new Date(),
                    duration: 14
               },
               {
                    id: "968-023",
                    name: "K-YLIOPPILASKYLÄNVALINTA",
                    address: "Inspehtorinkatu 4",
                    post_code: "20540",
                    city: "TURKU",
                    route_number: "611002",
                    infowindow_callback: null,
                    arrive_from: new Date(),
                    arrive_to: new Date(),
                    duration: 15
                }
                                                       
                ];
                
                // jos lisäät asiakkaita, muista lisätä kellonajat alla olevaan taulukkoon!!                
                // luvut ovat neljän sarjoja pötkässä: arrive_from tunnit, arrive_from minuutit, arrive_to tunnit, arrive_from minuutit ja sitten
                // seuraavan asiakkaat samat luvut
                
                var times = [6,0,14,0,7,0,12,0,6,0,12,0,8,0,12,0,8,0,12,0,7,0,10,0,8,0,10,0,15,0,20,0,15,0,21,0,15,0,21,0,15,0,20,0,15,0,20,0,13,0,18,0,4,0,11,0,5,0,7,0,4,0,6,0,6,0,10,0,6,0,11,0,6,0,14,0,7,0,12,0,6,0,12,0,8,0,12,0,8,0,12,0,7,0,10,0,8,0,10,0,4,0,11,0,5,0,7,0,4,0,6,0,6,0,10,0,6,0,11,0];
                var times_index=0;
                
                for(var i = 0; i < $scope.delivery_routes.length; i++) {
                	for(var j = 0; j < $scope.delivery_routes[i].customers.length; j++) {
                		$scope.delivery_routes[i].customers[j].arrive_from.setHours(times[times_index++]);
                		$scope.delivery_routes[i].customers[j].arrive_from.setMinutes(times[times_index++]);
                		$scope.delivery_routes[i].customers[j].arrive_to.setHours(times[times_index++]);
                		$scope.delivery_routes[i].customers[j].arrive_to.setMinutes(times[times_index++]);
                	}
                }
        }
        else {
        	// reitit löytyi localStoragesta, kasataan vielä Date()-objektit reitteihin ja niiden asiakkaisiin
        	for(var i = 0; i < $scope.delivery_routes.length; i++) {
        		$scope.delivery_routes[i].car_ready_time = new Date($scope.delivery_routes[i].car_ready_time);
        		for(var j = 0; j < $scope.delivery_routes[i].customers.length; j++) {
        			$scope.delivery_routes[i].customers[j].arrive_from = new Date($scope.delivery_routes[i].customers[j].arrive_from);
        			$scope.delivery_routes[i].customers[j].arrive_to = new Date($scope.delivery_routes[i].customers[j].arrive_to);
        		}
        	}
        }
        
        // ------ kesken, nämä pitää jotenkin kohdistaa valitun reitin markkeriin --------
        
        
        
        // ------- kesken päättyy ---------
        
        
        
        $scope.selected_route = null;	// delivery_routes -taulukon aktiivinen alkio eli nyt valittuna oleva reitti
        //$scope.latest_waypoint_array = null;
        
        if($scope.delivery_routes.length > 0) {
        	$scope.selected_route = $scope.delivery_routes[0]; // alkuarvona on taulukon ensimmäinen reitti
        }
                
      
        
        
        
        
//---------------------------------------------------------------------------------------- 
        
        $scope.fetchRoutes = function () {
        	
        // hakee reitit pysyvästä tallennuksesta (tällä hetkellä localStoragesta)
                	
//---------------------------------------------------------------------------------------- 	
        	
        	return JSON.parse(localStorage.getItem("keslog_routes"));
        }
        
        
        
        
}]); // mapCtrl









keslog_module.controller("routingCtrl", ['$scope', '$http', '$location', '$anchorScroll', function($scope, $http, $location, $anchorScroll) {

        $scope.car_weight="--";
        $scope.car_height="--";
        $scope.car_id="--";
        
        $scope.waypoints_string="";
        $scope.timetable = "";
        
        $scope.route_distance = 0;
        $scope.route_duration = 0;
        $scope.route_weight_restriction = max_weight_on_road;
        $scope.route_height_restriction = max_height_on_road;

        $scope.routechangetrigger = 0;
        $scope.force_apply_hack = true;	// tällä kontrolloidaan $watchin suoritusta (eli $scopen bindausten ajan tasalle saattamista) silloin kun karttaeventti on alkanut 
        								// $scopen ulkopuolella (käytännössä kartan callbackit). Jätä arvoksi true jotta watch tulisi ajettua silloin kun callback muuttaa 
        								// reittiviivaa scopen ulkopuolelta, ja laita arvoksi false juuri ennen kuin reittiviivan muuttumisen aikaansaava coderun alkaa $scopessa. 
        								// Tällä häkkäyksellä saadaan siis scopen bindaukset ajan tasalle silloin kun kartan callback muuttaa reittiviivaa, 
        								// Google Maps kun on callbackkeineen vähän eri paria Angularin kanssa.
        $scope.directionsRequest2 = {
                origin: "",
                destination: "",
                waypoints: $scope.waypoints_array,
                optimizeWaypoints: $scope.optimize_tsp,
                provideRouteAlternatives: false,
                durationInTraffic: true,
                travelMode: google.maps.DirectionsTravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.METRIC
            };


        $scope.new_customer_template = {
                id: "",
        	    name: "",
        	    address: "",
        	    post_code: "",
        	    city: "",
        	    route_number: "",
          	    arrive_from: new Date(),
          	    arrive_to: new Date(),
          	    duration: ""
            };
        
        $scope.new_customer_template.arrive_from.setHours(0);
        $scope.new_customer_template.arrive_from.setMinutes(0);
        $scope.new_customer_template.arrive_to.setHours(0);
        $scope.new_customer_template.arrive_to.setMinutes(0);
        
        // asetetaan kuuntelija ja callback kartan zoomaukselle
        
        google.maps.event.addListener($scope.map, 'zoom_changed', function() {
        	
            $scope.drawArrowsOnRoute($scope.selected_route);
          }
        );
        
//============================================ Map event listeners ========================================================== 

        /*google.maps.event.addListener($scope.directionsDisplay, 'click', function() {
        	console.log("Click!");
        });*/
        
        google.maps.event.addListener($scope.directionsDisplay, 'directions_changed', function() {
        	
        	console.log("map event");
       	
        	// otetaan laskettu tai muuttunut reittiviiva talteen valittuna olevan reitin tietoihin
        	
        	if($scope.selected_route !== null) {
        		
        		$scope.selected_route.route = $scope.directionsDisplay.getDirections();
          	}        
        	else
        		console.log("$scope.selected_route on null"); // tähän tullaan vain jos problemos problemos
        	
        	$scope.setRouteDistanceAndTime($scope.selected_route); // kirjoittaa hallintaikkunan alareunan tiedot
        	$scope.hideArrows();	// hävitetään mahdolliset edellisen näytetyn reittiviivan suuntanuolet
        	$scope.drawArrowsOnRoute($scope.selected_route);
    		$scope.routechangetrigger++;  	// tämän muutoksilla trigataan reitin pituuden ja keston laskenta kun reitti muuttuu
    		  		 		    		
        	if($scope.force_apply_hack === true) {	// ajetaan vain jos directions_changed event triggaantui $scopen ulkopuolella
        		console.log("forcetetaan watch...");
        		$scope.$apply();	// laukaisee kaikki watchit, coderun alkaa silloin scopesta joten bindatut muuttujat päivittyvät viewiin
        		console.log("watch laukaistu");
        	}
        	else {
        		
        		// coderun alkoi $scopesta, watchia ei tarvita
        		
        		console.log("ei ajeta watchia");
        		
        		// katsotaan sillat:
        		
        		//var checkroute = $scope.directionsDisplay.getDirections().routes[$scope.directionsDisplay.getRouteIndex()];
        		var checkroute = $scope.selected_route.route.routes[0];
        		var checkrouteresults = $scope.checkBridgesOnRoute(checkroute);
        		$scope.setRouteRestrictions(checkrouteresults);
        		$scope.setBridgeIcons(checkrouteresults);
        		$scope.setRouteTimetable2($scope.selected_route);
        	}
    		
    		
    		
    		});
        
//===========================================================================================================================================
        
        // alla olevan watchin ajolla saadaan scopessa bindatut muuttujat päivittymään viewiin myös silloin kun coderun EI alkanut scopen sisältä;
        
        // ongeman ydin on siinä että Google Mapsin callbackit eivät ala scopen sisältä, joten edellä olevassa map event listenerissä 
        // tehdyt muutokset scopessa oleviin muuttujiin eivät päivity viewiin ilman kikkailua; tämä watch-kuvio on kikkailu saada coderun 
        // alkamaan scopesta ja siten bindatut muuttujat päivittymään viewiin; tähän voi olla joku älykäs tapa hoitaa sama asia, mutta 
        // tämmöinen häkkäys tuli mieleen ja se myös toimii
        
        $scope.$watch('routechangetrigger', function(newVal, oldVal) {
        	
        	console.log("watchia ajetaan");

        	console.log("watch 1");
        	
        	if($scope.directionsDisplay.getDirections() === undefined) 	// saattaa valittaa "XML ei ole hyvämuotoista", "not well formed", ehkä ei haittaa
        		return;
        	
        	console.log("watch 2");
        	        	
        	// katsotaan sillat:
    		
    		var checkroute = $scope.directionsDisplay.getDirections().routes[$scope.directionsDisplay.getRouteIndex()];
    		var checkrouteresults = $scope.checkBridgesOnRoute(checkroute);
    		$scope.setRouteRestrictions(checkrouteresults);
    		$scope.setBridgeIcons(checkrouteresults);
        	$scope.setRouteTimetable2($scope.selected_route);
    		$scope.force_apply_hack = true;  // jätetään tämä päälle $scopen ulkopuolella tapahtuvien karttaeventtien varalle
        });
        
              
        /*$scope.$watchCollection('delivery_routes', function(newVal, oldVal) {
        	console.log("---- Routes talletettu ----");
        	$scope.storeRoutes();
        });*/
  
        
        
        
        
        
        
        
        
        
//---------------------------------------------------------------------------------------- 

        $scope.getCar = function (id) {
        
       	// palauttaa auton tiedot
        // id: auton id
                    	
//---------------------------------------------------------------------------------------- 	
        	
        	 
        	for(var i = 0; i < $scope.cars.length; i++) {
        		if($scope.cars[i].id == id)
        			return $scope.cars[i];
        	}
        	
        	console.log("Autoa ei ole: "+id+", autoja on "+$scope.cars.length);
        	return null;
        }

        
        
        
        
        
        
        
//---------------------------------------------------------------------------------------- 

        $scope.toggleEditRoute = function () {
        
       	// laittaa reitineditointi-ikkunan näkyviin ja pois
                    	
//---------------------------------------------------------------------------------------- 	
        	
        	        	
        	$scope.editroutewindowOpen =! $scope.editroutewindowOpen;
        	$scope.RendererOptions.draggable =! $scope.RendererOptions.draggable;
        	$scope.directionsDisplay.setOptions($scope.RendererOptions);
        }
        
        
        
        
        
        
        
        
        
//---------------------------------------------------------------------------------------- 
        

        $scope.addCustomerClickListeners = function(route) {
       
        // tehdään annetun reitin asiakasmarkkereille click-kuuntelija, joka togglaa 
        // asiakasmarkkerin infoikkunaa
        
        // route = delivery_routes -taulukon elementti joka kuvaa valittua reittiä
        	
//----------------------------------------------------------------------------------------
        
        	
        return; // ei käytetä mihinkään ennen kuin on valmis
        
        // - aseta reitin kaikille asiakkaille kuuntelija ja callback
        // - kaiva esiin markkeri ja kohdista kuuntelija siihen
                
        var directions = route.route.routes[0];
        
        //var fields = Object.keys($scope.directionsDisplay.k);
        /*for(var i = 0; i < fields.length; i++) {
        	
        }*/
        
        // kaivellaan resultin kenttien nimiä:
        //console.log(">>> KENTÄT: "+Object.keys($scope.directionsDisplay));
        //console.log("JSON: "+JSON.stringify($scope.directionsDisplay.k));
        //console.log(">>> KENTÄN PITUUS: "+Object.keys($scope.directionsDisplay.k.D.length+" kpl"));
        //console.log(">>> KENTÄN PITUUS: "+Object.keys($scope.directionsDisplay.k.B.length+" kpl"));
       
        for(var i = 1; i < directions.legs.length-1; i++) {
        	var customer_index = directions.waypoint_order[i];
           	add_customer_click_listener(route.customers[customer_index], $scope.directionsDisplay.B.I[i]);	// käpälöi directionsRendererin vakiomarkkereita
            }
        
        var add_customer_click_listener = function(customer, marker) {
        	console.log(">>>> Asetetaan kuuntelija, customer="+customer.name);  	
        	var infotext = "<div id='customer_infowindow'><span class='infowindowheader'>Asiakas</span>";
        	infotext += "<span class='infowindowtext'>Saavu "+customer.arrive_from+"</span><br>";
        	infotext += "<span class='infowindowtext'>Lähde "+customer.arrive_to+"</span><br>";
    		infotext += "</div>";
    		
        	var func = function() {
        		
        		// jos infoWindow on jo auki, suljetaan se

        		if(this.infowindow !== undefined && this.infowindow.is_open === true) {
        			this.infowindow.is_open = false;
        			this.infowindow.close();
        			return;
        		}
        		
        		// tämä infoWindow aukeaa kun markkeria klikataan

        		this.infowindow = new google.maps.InfoWindow({
        			maxWidth: 500,
        			content: infotext,
        			is_open: false
        		});
        		
        		// lisätään kuuntelija infoWindown close-napille, jotta toggle toimii sen 
        		// painamisen jälkeenkin oikein (eli is_open vaihtuu falseksi)
        		
        		google.maps.event.addListener(this.infowindow,'closeclick',function() {
        			this.is_open = false;
        			this.close();
        		});
        		
        		this.infowindow.is_open = true;
        		this.infowindow.open($scope.map, marker);
        	}
        	
        	// asetetaan yo. funktio markkeriin callback-funktioksi kun markkeria klikataan
        	customer.infowindow_callback = func;
        	
        	// aseta klikkausten kuuntelija, joka triggaa callbackin markkerista
        	google.maps.event.addListener(marker, 'click', func);

        }
        
        
        
        
        // asetetaan edellinen kaikille asiakkaille
        
        /*for(var i = 0; i < $scope.delivery_routes.length; i++) {
    		for(var j = 0; j < $scope.delivery_routes[i].customers.length; j++) {
    			$scope.add_customer_click_listener($scope.delivery_routes[i].customers[j]);
    		}
    	}    */
        
}


        
        
        
      
        
        
//---------------------------------------------------------------------------------------- 
        
        $scope.storeRoutes = function () {
        	
        // tallentaa reitit pysyvästi (tällä hetkellä localStorageen)
                	
//---------------------------------------------------------------------------------------- 	
        	
        	// otetaan istuntokohtaiset tiedot pois ettei sotke seuraavaa istuntoa
        	
        	console.log("---- storeRoutes() ----");
        	
        	// kloonataan reittilista
        	var routes_json = JSON.stringify($scope.delivery_routes);
        	var routes = JSON.parse(routes_json);
        	
        	// karsitaan kloonista muutama istuntokohtainen kenttä joita ei pidä mennä tallentamaan tai seuraava istunto hajoaa
        	for(var i = 0; i < routes.length; i++) {
        		routes[i].route = null;
        		routes[i].infowindow_callback = null;
        		routes[i].waypoint_order = [];
        		routes[i].duration = parseInt(routes[i].duration);
        		for(var j = 0; j < routes[i].customers.length; j++) {
        			delete routes[i].customers[j].$$hashKey;
        		}
        	}
        	
        	// tellennus
        	
        	localStorage.setItem("keslog_routes", JSON.stringify(routes));
        	
        	console.log("---- Routes talletettu ----");
        }
        	
        	
        
        
                
        
        
        
        	
        
        
//---------------------------------------------------------------------------------------- 
        
        $scope.removeCustomer = function (route, id) {
        	
        // poistaa asiakkaan reitistä, ei kuitenkaan päivitä kantaan vaan localStorageen;
        // modataan myöhemmin päivittämään myös kantaan
                	
//---------------------------------------------------------------------------------------- 	
        	
        	for(var i = 0; i < route.customers.length; i++) {
        		var customer = route.customers[i];
        		if(customer.id == id) {
        			route.customers.splice(i, 1);
        			$scope.calculateRoute(null);
        		}
        	}
        	$scope.storeRoutes();
        }
        

        
        
        
        
        
        
//---------------------------------------------------------------------------------------- 
        
        $scope.addNewCustomer = function (route) {
        	
        // lisää uuden asiakkaan tiedot reittiin, ei kuitenkaan tallenna kantaan;
        // tämä modataan myöhemmin niin että tiedot menee kantaan
            	
//---------------------------------------------------------------------------------------- 	
        	
			$scope.new_customer_template.route_number = route.id;
			route.customers.push($scope.new_customer_template);
			$scope.new_customer_template = {
	                id: "",
	        	    name: "",
	        	    address: "",
	        	    post_code: "",
	        	    city: "",
	        	    route_number: "",
	          	    arrive_from: new Date(0),
	          	    arrive_to: new Date(0),
	          	    duration: ""
	            };
			$scope.storeRoutes();
			$scope.calculateRoute(null);
		}
        
   
        
        
        
       
        
//----------------------------------------------------------------------------------------
        
        $scope.removeSelectedRoute = function() {
        	
        // poistaa valittuna olevan reitin, reittiin liittyvät asiakkaat säilyvät;
        // ei poista mitään pysyvästi, kantaa ei ole vielä käytössä
                	
//---------------------------------------------------------------------------------------- 	        	
        	
        	if($scope.selected_route === undefined || $scope.selected_route === null)
        		return;
        	
        	for(var i = 0; i < $scope.delivery_routes.length; i++) {
        		if($scope.delivery_routes[i].id == $scope.selected_route.id) {
        			$scope.delivery_routes.splice(i, 1);	// ota ensimmäinen tällä id:llä löytyvä veke ja poistu
        			i = Math.max(0, i-1);
        			$scope.selected_route = $scope.delivery_routes[i];
        			$scope.routeSelected();
        			$scope.storeRoutes();
        			return;
        		}
        	}
        }
        
        
        
        
        
        
        
        
        
//----------------------------------------------------------------------------------------
        
        $scope.checkNewCustomer = function () {
        	
        // tarkistaa onko uuden asiakkaan tiedot täytetty niin että ne 
        // voidaan lisätä asiakaslistaan
                	
//----------------------------------------------------------------------------------------
        	
        	var customer = $scope.new_customer_template;
        	if(customer.id.length == 0 || customer.name.length < 3 || customer.address.length == 0 || customer.post_code.length < 5 || customer.city.length < 2 || customer.arrive_from === null || customer.arrive_to === null || customer.arrive_from > customer.arrive_to || customer.duration.length <= 0) {
        		//console.log("uusi asiakas ei käy");
        		return false;
        	}
        	else {
        		console.log("uusi asiakas ok");
        		return true;
        	}
        }
        
        

        
        
        
        
        
    
//----------------------------------------------------------------------------------------
        
        $scope.sanitizeCarReadyTime = function () {
        	
        // tarkistaa kellonajan järkevyyden ja korjaa tarvittaessa
        // Ei ehkä tule tehtyä, koska kellonajanvalinta palauttaa nullia jos aika ei ole järkevä
                	
//----------------------------------------------------------------------------------------
        	
        	if($scope.selected_route.car_ready_time === null) 
        		return;
        	
        }
        
        
        
        
        
        
        
        
        
//---------------------------------------------------------------------------------------- 
        
        $scope.addNewRoute = function () {
        	
        // lisää uuden reitin, ei kuitenkaan tallenna kantaan;
        // tämä modataan myöhemmin niin että tiedot menee kantaan
            	
//---------------------------------------------------------------------------------------- 	
        	
        	
        	var routetemplate = {
            	terminal_address: "",
                id: "000000",
                terminal_image: "keslog_logo_pieni.png",
                description: "Your new route",
                route: null,				// directionsResult-objekti, laskettu reitti laitetaan tänne talteen
                waypoint_order: [],			// directionsResult-objektin waypoint_order-taulukko, laitetaan talteen tähän
                car_ready_time: new Date(),
                earliest_start_time: "",
                latest_start_time: "",		// lähtöaikahaarukan myöhempi pää TSPTW-optimissa reitissä
                car_id: 100,
                customers: []
            };
        	
        	
        	// lisää uusi asiakas reittiin
        	
        	$scope.delivery_routes.push(routetemplate);
        	
        	// Avaa uuden reitin (tyhjä) asiakaslista
        	
        	$scope.selected_route = $scope.delivery_routes[$scope.delivery_routes.length-1];
        	$scope.routeSelected();
        	$scope.editroutewindowOpen = true;
        	
        	$scope.storeRoutes();
        	
        	/*else if($scope.selected_route !== null)
        		$scope.editroutewindowOpen = true;*/
        	
        }
        
       
        
        
        
        
        
//----------------------------------------------------------------------------------------
        
        $scope.getWaypoints = function(route) {
        	
        // palauttaa valitun reitin tiedot stringinä esim. reittilaskentaa varten;
        // route: valittu reitti
        	
        // tämä modataan myöhemmin niin että tiedot luetaan tietokannasta
        	
//---------------------------------------------------------------------------------------- 	
        
        	if(route === undefined || route === null)
        		return null;
        	
        	return route.customers;
        }
        
        
        
        
        
        
       
        
//----------------------------------------------------------------------------------------
        
        $scope.setTrafficLayer = function() {
        	
        // Vaihtaa trafficLayerin näkyviin ja pois
        	
//---------------------------------------------------------------------------------------- 	
        	
        	if($scope.traffic === false)
        		$scope.trafficLayer.setMap(null);
        	else
        		$scope.trafficLayer.setMap($scope.map);
        }
        
        
        
       
        
        
        
        
        
        
//----------------------------------------------------------------------------------------
        
        $scope.changeCar = function(changedfield) {
        	
        // Vaihtaa auton paino-ja korkeustiedot käliin kun auto-ID:tä muutetaan kälissä
        // changedfield: muutetun kentän indeksi
        	
//---------------------------------------------------------------------------------------- 	
        	
        	for(var i = 0; i < $scope.cars.length; i++) {
        		
        		if($scope.cars[i].id == $scope.car_id) {
        			
        			// muutetaan auton tiedot jos auto-id:tä muutettiin, muuten ei muuteta
        			if(changedfield == 0) {
        			$scope.car_weight = $scope.getCar($scope.selected_route.car_id).weight;
        			$scope.car_height = $scope.getCar($scope.selected_route.car_id).height;
        			}
        			console.log("Auton paino on "+$scope.car_weight+", korkeus on "+$scope.car_height);
        			// auton vaihto saattoi muuttaa reitin siltarajoituksia
        			
        			if($scope.selected_route === undefined || $scope.selected_route === null)
        				return;
        			
        			var checkrouteresults = $scope.checkBridgesOnRoute($scope.selected_route.route.routes[0]);
            		$scope.setRouteRestrictions(checkrouteresults);
            		$scope.setBridgeIcons(checkrouteresults);
            		
        			return;
        		}
        	}
        	
        }
        
     
       
        
        
        
        
        
        
        
        
        
//---------------------------------------------------------------------------------------- 
        
        $scope.getMatrixRequestURL = function(route) {
        	
        // muodostaa URL:n Distance Matrix API -kutsulle
        // route: valittu reitti
            	
//----------------------------------------------------------------------------------------
        	
        	var matrix_url = "/maps/api/distancematrix/json?";
    		var origins = "origins=";
    		var destinations = "&destinations=";
    		for(var index = 0; index < route.customers.length; index++) {
    			if(index > 0) {
    				origins += "|";
    				destinations += "|";
    			}
    			origins += route.customers[index].address + "," + route.customers[index].post_code + "," + route.customers[index].city;
    			destinations += route.customers[index].address + "," + route.customers[index].post_code + "," + route.customers[index].city;
    		}
    		matrix_url += origins;
    		matrix_url += destinations;
    		matrix_url += "&language=fi-FI&channel=gapps";
    		
    		console.log("Matrix URL: "+matrix_url);
    		//localStorage.setItem("Keslog-distancematrix-request-url", matrix_url);	
    		return matrix_url;
        }
        
        
        
        
        
        
        
     
        
/*----------------------------------------------------------------------------------------
        var routeBefore = undefined;
        var routeBeforeOptimized = false;
        
        
        $scope.setRouteTimetable = function (route) {
        	
        // muodostaa reittiaikataulun annetusta reitistä ja tulostaa sen omaan ikkunaansa
        // route: valittu reitti
        	
//----------------------------------------------------------------------------------------
        	if (routeBeforeOptimized && route == routeBefore) {
        		console.log("YOU SHALL NOT PASS!", "(Yritettiin ajaa samaa routee uuestaan)");
        		routeBefore = undefined;
        		routeBeforeOptimized = false;
        		return;
        	}
        	else {
        		routeBefore = route;
        	}
        	
        	console.log("Reittiaikataulun kirjoitus, id="+route.id);
        	
        	if(route === undefined || route === null) {
        		console.log("Reittiä ei ole");
        		return;
        	}
        	
        	if($scope.optimize_tw === true) {
        		// if($scope.optimize_tw === true && tw_under_work == false) {
        		// lasketaan aikaikkunoihin osumattomuudet
        		
        		console.log("Yritetään checkTimeWindows, id="+route.id+" ja time="+route.car_ready_time);
        		var problems = $scope.checkTimeWindows(route, route.car_ready_time);
            	if(problems == 0)
            		console.log("Reitti on TSPTW-optimi");
            	else {
            		console.log("Reitti ei ole TSPTW-optimi");
            	}
            	
            	// katsotaan mahdollisuudet muuttaa TSPTW:ksi jos ei ole; jos on TSPTW, lasketaan lähtöaikaikkuna
            	
            	var tsptw = $scope.adjustDepartureTime(route);
        		if(tsptw === null) {
        			console.log("Reitistä ei saa TSPTW-optimia pelkästään lähtöaikaa säätämällä");
        			$scope.selected_route.latest_start_time = "";
        			$scope.selected_route.earliest_start_time = "";
        			
        			// yritetään muuttaa reitin ajojärjestystä
        			
        			var route_json = JSON.stringify(route);
            		localStorage.setItem("Keslog-distancematrix-route-json", route_json);
            		
        			var matrix_url = $scope.getMatrixRequestURL(route);        		
            		var responsePromise = $http.get(matrix_url);         
                    responsePromise.success(function (data, status, headers, config) {
                    	
                    	// Jos Distance Matrix APIn quota on ylitetty, otetaan resultti localStoragesta
                    	
                    	if(data.status == "OVER_QUERY_LIMIT") {
                    		data = JSON.parse(localStorage.getItem("keslog-matrix-"+route.id));
                    		//data = eval(localStorage.getItem("keslog-matrix-"+route.id));
                    		console.log("Storagesta ulos: ", data);
                    		console.log("** Distance Matrix API OVER_QUERY_LIMIT, otetaan vanha versio välimuistista");
                    		// console.log("Distance Matrix result: ", data);
                    	}
                    	else if(data.status == "OK") {
                    		
                    		// laitetaan resultti talteen over quotan varalle
                    		
                    		localStorage.setItem("keslog-matrix-"+route.id, JSON.stringify(data));
                    	}
                    	var start_time = new Date();
                        
                        //
                        // Tsekataan onko reitti jo optimoitu .
                        // Tämä on nopea workaround tuohon ongelmaan joka antaa undefined vastauksen.
                        // Ongelma on se, että optimoinnille annetaan route, joka on jo optimoitu. Samalla annetaan vanha matriisi jonka takia tulee erroreita. 
                        // Ei löydä optimaalista reittiä kun menee kaikki vinoon.
                        // 
                        
                        if (route.optimized_workaround && route.optimized_workaround.length == route.customers.length) { 
                            console.log("VALMIIKSI OPTIMOITU: ", route);
                            var tw_result = route.optimized_workaround; 
                            
                        } else { 
                            console.log("OPTIMOIDAAN: ", route);
                            var tw_result = $scope.optimize_time_windows(route, data); 
                        }
                    	
                        if (tw_result.length != route.customers.length) {
                        	alert("Ei löydetty mahdollisia reittejä.");
                        }
                        
                        var end_time = new Date();
                    	console.log("TW-optimoinnin tulos: " + tw_result + " (aikaa kului " + (end_time - start_time) + " ms)");
                    	

                    	
                    	
                    	
                    	$scope.timetable = "";
                    	
                    	var timetable = "<div class=\"routeheader\">route "+route.id+"</div>";
                        timetable += "<div class=\"customermeta_start\">";
                        
                        // ollaan syöttämässä uutta reittiä ja siinä ei ole annettu vielä mitään tietoja

                    	timetable += "Departure within "+$scope.getRouteTimeAsString($scope.getSecondsFromTime2(route.earliest_start_time))+" - ";
                    	timetable += $scope.getRouteTimeAsString($scope.getSecondsFromTime2(route.latest_start_time))+" to catch customers\' time windows";
                       
                        
                        // otetaan kuluvan ajan alkuarvoksi joko aikahaarukan aikaisin pää jos se on tiedossa, muuten auton aikaisin lähtöaika
                        
                        var elapsed_time;
                        if(route.earliest_start_time == "")
                        	elapsed_time = $scope.getSecondsFromTime(route.car_ready_time);
                        else
                            elapsed_time = $scope.getSecondsFromTime2(route.earliest_start_time);

                        var initial_time = elapsed_time;	// lähtöaika talteen
                        var distance_travelled = 0;
                        var leg;           
                        var stopover_counter = 1;
                        
                        //console.log("waypoint_orderin pituus on "+selectedroute.waypoint_order.length);
                        //var stringi = JSON.stringify($scope.directionsDisplay.getDirections().routes[0]);
                        //console.log("JSON: "+stringi.substr(stringi.indexOf("waypoint_order")));
                        
                        // otetaan waypointit directionsRoute-objektista;
                        // HACK ALERT!! Jos reittiviivaa suorakäsitellään, waypoint_order -taulukko tyhjenee kaikessa hiljaisuudessa (Google ei 
                        // ilmeisesti halua luvata enää samaa TSP-optimia ajojärjestystä). Siksi taulukosta pidetään kopiota reittipistetaulukossa 
                        // ja käytetään tarvittaessa
                        
                        var waypoint_order;
                        var directions = route.route.routes[0];
                        if(directions.waypoint_order.length == 0 && route !== null && route !== undefined && route.customers.length > 0) {
                        	waypoint_order = route.waypoint_order;	// reittiviivaa on dragattu ja waypoint_order-taulukko on siksi nollaantunut -> käytetään talletettua versiota
                        }
                        else {	
                        	waypoint_order = directions.waypoint_order;
                        	route.waypoint_order = waypoint_order;	// talletetaan waypoint_order-taulukko reittitietoihin jos sellainen on
                        }
                        
                        // käydään asiakkaat läpi ajojärjestyksessä;
                        // legejä on yksi enemmän kuin asiakkaita, koska reissu alkaa ja päättyy samaan terminaaliin
                        
                        var customer;
                        var customer_index;
                        
                        // poimitaan asiakkaat taulukosta TSP-optimoidussa järjestyksessä
                        
                        for(var j = 0; j < waypoint_order.length; j++) {
                        	customer_index = waypoint_order[j];
                        	customer = route.customers[customer_index];
                                    	
                        	leg = directions.legs[j];
                        	distance_travelled += leg.distance.value;	// metrejä
                            elapsed_time += leg.duration.value;			// sekunteja
                            timetable += "<div class=\"customer\">";
                        	timetable += "<span class=\"customername\">" + customer.name+"</span><br>"+customer.address+", "+customer.city+"<br />";
                        	
                        	timetable += "<div class=\"eta-etd-container\">"; // class eikä id siksi että ng-bind-html poistaa id:n jostakin syystä (sanitizer säätää?)
                        	
                        	if($scope.optimize_tw === true && (elapsed_time + 30 < $scope.getSecondsFromTime(customer.arrive_from)))
                        		timetable += "<span class=\"routewarning eta\" title=\"Estimated arrival time is not within the customer\'s time window\">ETA: "+$scope.getRouteTimeAsString(elapsed_time) + " (" + $scope.getTimeDifferenceAsString(elapsed_time, $scope.getSecondsFromTime(customer.arrive_from)) + ")</span>";
                        	else if($scope.optimize_tw === true && (elapsed_time - 30 > $scope.getSecondsFromTime(customer.arrive_to)))
                        		timetable += "<span class=\"routewarning eta\" title=\"Estimated arrival time is not within the customer\'s time window\">ETA: "+$scope.getRouteTimeAsString(elapsed_time) + " (" + $scope.getTimeDifferenceAsString(elapsed_time, $scope.getSecondsFromTime(customer.arrive_to)) + ")</span>";
                        	else
                        		timetable += "<span class=\"eta\">ETA: "+$scope.getRouteTimeAsString(elapsed_time) +"</span>";           
                        	
                        	elapsed_time += customer.duration * 60; 	// viipyminen asiakkaalla sekunteina     
                        	timetable += "<br>";
                        	
                        	var luku1 = elapsed_time;
                        	var luku2 = $scope.getSecondsFromTime(customer.arrive_to);
            				//console.log("vertaillaan aikoja "+luku1+" > "+luku2);
                        	
                        	if($scope.optimize_tw === true && (elapsed_time - 30 > $scope.getSecondsFromTime(customer.arrive_to)))
                        		timetable += "<span class=\"routewarning etd\" title=\"Estimated departure time is not within the customer\'s time window\">ETD: "+$scope.getRouteTimeAsString(elapsed_time)+" (" + $scope.getTimeDifferenceAsString(elapsed_time, $scope.getSecondsFromTime(customer.arrive_to)) + ")</span>";
                        	else if($scope.optimize_tw === true && elapsed_time + 30 < $scope.getSecondsFromTime(customer.arrive_from))
                        		timetable += "<span class=\"routewarning etd\" title=\"Estimated departure time is not within the customer\'s time window\">ETD: "+$scope.getRouteTimeAsString(elapsed_time)+" (" + $scope.getTimeDifferenceAsString(elapsed_time, $scope.getSecondsFromTime(customer.arrive_from)) + ")</span>";
                        	else
                        		timetable += "<span class=\"etd\">ETD: "+$scope.getRouteTimeAsString(elapsed_time) +  "</span>";
                        	
                        	stopover_counter++;
                        	timetable += "</div></div>";
                        	console.log("Piirretään timetable")
                        	
                        	
                        	// reititä näillä
                        	
                        	//tw_under_work = true;
                    		routeBeforeOptimized = true;
                        	$scope.calculateRoute(directionsRequest);
                        	console.log("Time windows -muotoinen reitityspyyntö lähti");
                        	
                        	
                        }
                        
                        
                        // huomioi vielä paluulegi terminaalille
                        
                        leg = directions.legs[j];
                        elapsed_time += leg.duration.value;
                        distance_travelled += leg.distance.value;
                        
                        if(route.customers.length > 0)
                        	timetable += "<div class=\"customermeta_end\">Return to terminal<br>ETA: "+$scope.getRouteTimeAsString(elapsed_time)+"<br>Total: "+$scope.getRouteTimeAsString(elapsed_time-initial_time)+", "+precise_round((distance_travelled/1000),1)+" km</div>";
                        
                        timetable += "</div><div class=\"routeheader\">route end</div>";
                        $scope.timetable = timetable;
                    	console.log("REITTI KIRJOITETTU UUDESTAAN")
                    	
                    	
// sitten vielä uusi reittipyyntö time windows -järjestyksellä ilman tsp:tä piirtoa varten
                    	
                    	var directionsRequest = {
                                origin: route.terminal_address,
                                destination: route.terminal_address,
                                waypoints: [],
                                optimizeWaypoints: false,
                                provideRouteAlternatives: false,
                                durationInTraffic: false,
                                travelMode: google.maps.DirectionsTravelMode.DRIVING,
                                unitSystem: google.maps.UnitSystem.METRIC
                            };
                    	
                    	// ladotaan asiakkaat taulukkoon tw-optimoidussa järjestyksessä
                    	
                    	var stopover_array = [];
                    	for(index = 0; index < tw_result.length; index++) {
                            stopover_array[index] = {
                                    location: route.customers[tw_result[index]].address+","+route.customers[tw_result[index]].post_code+","+route.customers[tw_result[index]].city,
                                    stopover: true};
                        }
                    	//console.log("DIRECTIONS REQUEST: ", directionsRequest);
                    	directionsRequest.waypoints = stopover_array;
                    	
                    	
                    	
                    });
                    responsePromise.error(function (data, status, headers, config) {
                        console.log("Distance Matrix API call FAILED, status="+status);
                    });
        		}
        		else {
        			console.log("Reitti on TSPTW-optimi jos lähtöaika on "+$scope.getRouteTimeAsString(tsptw[0])+"..."+$scope.getRouteTimeAsString(tsptw[0]+tsptw[1]));    			
        			$scope.selected_route.latest_start_time = $scope.getTimeFromSeconds(tsptw[0]+tsptw[1]);
        			$scope.selected_route.earliest_start_time = $scope.getTimeFromSeconds(tsptw[0]);
        		}
        	}
        	
        	// tw-optimointi ei ole päällä
        	
        	else {
        		$scope.selected_route.latest_start_time = "";
    			$scope.selected_route.earliest_start_time = "";
        	}
        	
        	//tw_under_work = false;
        	//$scope.setRouteTimetable($scope.selected_route);
        	
        	
        	
            
              
             *  terminal_address: "Avantintie 29, 21420 Lieto, Finland",
                id: "301046", 
                description: "Naantali-Masku",
                route: null,				// directionsResult-objekti, laskettu reitti laitetaan tänne talteen
                start_time: "0500",
                car_id: 100
                
             * 
             *  id: "200-149",
        	    name: "K-SUPERMARKET LIETO",
        	    address: "Hyvättyläntie 2",
        	    post_code: "21420",
        	    city: "LIETO",
        	    route_number: "301071",
          	    arrive_from: "1500",
          	    arrive_to: "2000",
          	    duration: "18"
             
            
            // reitin 301046 optimoitu waypoint_order:[6,2,4,3,1,0,5], eli ensin mennään K-market Maskuun Kekuskaari 5:een
            
        	var timetable = "<div class=\"routeheader\">route "+route.id+"</div>";
            timetable += "<div class=\"customermeta_start\">";
            
            // ollaan syöttämässä uutta reittiä ja siinä ei ole annettu vielä mitään tietoja
            
            if(route.route === null || route.route === undefined) {
            	timetable += "<br><br>No customers on this route<br><br><br>";
            	timetable += "</div><div class=\"routeheader\">route end</div>";
            	$scope.timetable = timetable;
            	return;
            }
            
            if(route.customers.length == 0) {
            	timetable += "<br><br>No customers on this route<br><br><br>";
            }
            else if($scope.optimize_tw === true && route.latest_start_time.length > 0) {
            	timetable += "Departure within "+$scope.getRouteTimeAsString($scope.getSecondsFromTime2(route.earliest_start_time))+" - ";
            	timetable += $scope.getRouteTimeAsString($scope.getSecondsFromTime2(route.latest_start_time))+" to catch customers\' time windows";
            }
            else if(route.latest_start_time == "" && $scope.optimize_tw === true) {
            	timetable += "Earliest departure at "+$scope.getRouteTimeAsString($scope.getSecondsFromTime(route.car_ready_time));
            	timetable += "<br><br>Couldn\'t determine a departure time to catch all time windows on route";
            }            
            else 
            	timetable += "Earliest departure at "+$scope.getRouteTimeAsString($scope.getSecondsFromTime(route.car_ready_time));
            timetable += "</div>";
            
            // otetaan kuluvan ajan alkuarvoksi joko aikahaarukan aikaisin pää jos se on tiedossa, muuten auton aikaisin lähtöaika
            
            var elapsed_time;
            if(route.earliest_start_time == "")
            	elapsed_time = $scope.getSecondsFromTime(route.car_ready_time);
            else
                elapsed_time = $scope.getSecondsFromTime2(route.earliest_start_time);

            var initial_time = elapsed_time;	// lähtöaika talteen
            var distance_travelled = 0;
            var leg;           
            var stopover_counter = 1;
            
            //console.log("waypoint_orderin pituus on "+selectedroute.waypoint_order.length);
            //var stringi = JSON.stringify($scope.directionsDisplay.getDirections().routes[0]);
            //console.log("JSON: "+stringi.substr(stringi.indexOf("waypoint_order")));
            
            // otetaan waypointit directionsRoute-objektista;
            // HACK ALERT!! Jos reittiviivaa suorakäsitellään, waypoint_order -taulukko tyhjenee kaikessa hiljaisuudessa (Google ei 
            // ilmeisesti halua luvata enää samaa TSP-optimia ajojärjestystä). Siksi taulukosta pidetään kopiota reittipistetaulukossa 
            // ja käytetään tarvittaessa
            
            var waypoint_order;
            var directions = route.route.routes[0];
            if(directions.waypoint_order.length == 0 && route !== null && route !== undefined && route.customers.length > 0) {
            	waypoint_order = route.waypoint_order;	// reittiviivaa on dragattu ja waypoint_order-taulukko on siksi nollaantunut -> käytetään talletettua versiota
            }
            else {	
            	waypoint_order = directions.waypoint_order;
            	route.waypoint_order = waypoint_order;	// talletetaan waypoint_order-taulukko reittitietoihin jos sellainen on
            }
            
            // käydään asiakkaat läpi ajojärjestyksessä;
            // legejä on yksi enemmän kuin asiakkaita, koska reissu alkaa ja päättyy samaan terminaaliin
            
            var customer;
            var customer_index;
            
            // poimitaan asiakkaat taulukosta TSP-optimoidussa järjestyksessä
            
            for(var j = 0; j < waypoint_order.length; j++) {
            	customer_index = waypoint_order[j];
            	customer = route.customers[customer_index];
                        	
            	leg = directions.legs[j];
            	distance_travelled += leg.distance.value;	// metrejä
                elapsed_time += leg.duration.value;			// sekunteja
                timetable += "<div class=\"customer\">";
            	timetable += "<span class=\"customername\">" + customer.name+"</span><br>"+customer.address+", "+customer.city+"<br />";
            	
            	timetable += "<div class=\"eta-etd-container\">"; // class eikä id siksi että ng-bind-html poistaa id:n jostakin syystä (sanitizer säätää?)
            	
            	if($scope.optimize_tw === true && (elapsed_time + 30 < $scope.getSecondsFromTime(customer.arrive_from)))
            		timetable += "<span class=\"routewarning eta\" title=\"Estimated arrival time is not within the customer\'s time window\">ETA: "+$scope.getRouteTimeAsString(elapsed_time) + " (" + $scope.getTimeDifferenceAsString(elapsed_time, $scope.getSecondsFromTime(customer.arrive_from)) + ")</span>";
            	else if($scope.optimize_tw === true && (elapsed_time - 30 > $scope.getSecondsFromTime(customer.arrive_to)))
            		timetable += "<span class=\"routewarning eta\" title=\"Estimated arrival time is not within the customer\'s time window\">ETA: "+$scope.getRouteTimeAsString(elapsed_time) + " (" + $scope.getTimeDifferenceAsString(elapsed_time, $scope.getSecondsFromTime(customer.arrive_to)) + ")</span>";
            	else
            		timetable += "<span class=\"eta\">ETA: "+$scope.getRouteTimeAsString(elapsed_time) +"</span>";           
            	
            	elapsed_time += customer.duration * 60; 	// viipyminen asiakkaalla sekunteina     
            	timetable += "<br>";
            	
            	var luku1 = elapsed_time;
            	var luku2 = $scope.getSecondsFromTime(customer.arrive_to);
				//console.log("vertaillaan aikoja "+luku1+" > "+luku2);
            	
            	if($scope.optimize_tw === true && (elapsed_time - 30 > $scope.getSecondsFromTime(customer.arrive_to)))
            		timetable += "<span class=\"routewarning etd\" title=\"Estimated departure time is not within the customer\'s time window\">ETD: "+$scope.getRouteTimeAsString(elapsed_time)+" (" + $scope.getTimeDifferenceAsString(elapsed_time, $scope.getSecondsFromTime(customer.arrive_to)) + ")</span>";
            	else if($scope.optimize_tw === true && elapsed_time + 30 < $scope.getSecondsFromTime(customer.arrive_from))
            		timetable += "<span class=\"routewarning etd\" title=\"Estimated departure time is not within the customer\'s time window\">ETD: "+$scope.getRouteTimeAsString(elapsed_time)+" (" + $scope.getTimeDifferenceAsString(elapsed_time, $scope.getSecondsFromTime(customer.arrive_from)) + ")</span>";
            	else
            		timetable += "<span class=\"etd\">ETD: "+$scope.getRouteTimeAsString(elapsed_time) +  "</span>";
            	
            	stopover_counter++;
            	timetable += "</div></div>";
            }
            
            
            // huomioi vielä paluulegi terminaalille
            
            leg = directions.legs[j];
            elapsed_time += leg.duration.value;
            distance_travelled += leg.distance.value;
            
            if(route.customers.length > 0)
            	timetable += "<div class=\"customermeta_end\">Return to terminal<br>ETA: "+$scope.getRouteTimeAsString(elapsed_time)+"<br>Total: "+$scope.getRouteTimeAsString(elapsed_time-initial_time)+", "+precise_round((distance_travelled/1000),1)+" km</div>";
            
            timetable += "</div><div class=\"routeheader\">route end</div>";
            $scope.timetable = timetable;
        	console.log("REITTI KIRJOITETTU")
        }*/
        	
        
        
        
        
        
        
        
        
//----------------------------------------------------------------------------------------
        
   
        $scope.setRouteTimetable2 = function (route) {
        	
        // muodostaa reittiaikataulun annetusta reitistä ja tulostaa sen omaan ikkunaansa
        // route: valittu reitti
        	
//----------------------------------------------------------------------------------------
       
        	
        	console.log("Reittiaikataulun kirjoitus, id="+route.id);
        	console.log("Reittiaikataulussa reitti on ", route);
            
            /*  
             *  terminal_address: "Avantintie 29, 21420 Lieto, Finland",
                id: "301046", 
                description: "Naantali-Masku",
                route: null,				// directionsResult-objekti, laskettu reitti laitetaan tänne talteen
                start_time: "0500",
                car_id: 100
                
             * 
             *  id: "200-149",
        	    name: "K-SUPERMARKET LIETO",
        	    address: "Hyvättyläntie 2",
        	    post_code: "21420",
        	    city: "LIETO",
        	    route_number: "301071",
          	    arrive_from: "1500",
          	    arrive_to: "2000",
          	    duration: "18"
             */
            
            // reitin 301046 optimoitu waypoint_order:[6,2,4,3,1,0,5], eli ensin mennään K-market Maskuun Kekuskaari 5:een
            
        	var timetable = "<div class=\"routeheader\">route "+route.id+"</div>";
            timetable += "<div class=\"customermeta_start\">";
            
            // ollaan syöttämässä uutta reittiä ja siinä ei ole annettu vielä mitään tietoja
            
            if(route.route === null || route.route === undefined) {
            	timetable += "<br><br>No customers on this route<br><br><br>";
            	timetable += "</div><div class=\"routeheader\">route end</div>";
            	$scope.timetable = timetable;
            	return;
            }
            
            if(route.customers.length == 0) {
            	timetable += "<br><br>No customers on this route<br><br><br>";
            }
            /*else if($scope.optimize_tw === true && route.latest_start_time.length > 0) {
            	timetable += "Departure within "+$scope.getRouteTimeAsString($scope.getSecondsFromTime2(route.earliest_start_time))+" - ";
            	timetable += $scope.getRouteTimeAsString($scope.getSecondsFromTime2(route.latest_start_time))+" to catch customers\' time windows";
            }*/
            
            // lähtöaikahaarukka on onnistuttu laskemaan (tw on tai ei ole päällä)
            if(route.latest_start_time.length > 1) {
            	timetable += "Departure within "+$scope.getRouteTimeAsString($scope.getSecondsFromTime2(route.earliest_start_time))+" - ";
            	timetable += $scope.getRouteTimeAsString($scope.getSecondsFromTime2(route.latest_start_time))+" to catch customers\' time windows";
            }
            
            // tw-optimointi on päällä ja optimi löydetty, mutta vain silloin kun auton lähtöaika on liian aikaisin
            else if(route.latest_start_time == "" && $scope.optimize_tw === true) {
            	timetable += "Earliest departure at "+$scope.getRouteTimeAsString($scope.getSecondsFromTime(route.car_ready_time));
            	timetable += "<br><br>Couldn\'t determine a departure time range to catch all time windows on route";
            	timetable += "<br><br>Adjusting car ready time in \"Edit route\" will solve this";
            }
            
            // tw-optimointi on päällä, mutta tw-optimia reittiä ei onnistuttu laskemaan
            else if(route.latest_start_time == " ") {
            	timetable += "Earliest departure at "+$scope.getRouteTimeAsString($scope.getSecondsFromTime(route.car_ready_time));
            	timetable += "<br><br>Couldn\'t determine a departure time range to catch all time windows on route";
            	timetable += "<br><br>Customers\' time windows need adjusting";
            } 
            
            // lähtöaikahaarukkaa ei saatu laskettua (tw on tai ei ole päällä)
            else if(route.latest_start_time == "") {
            	timetable += "Earliest departure at "+$scope.getRouteTimeAsString($scope.getSecondsFromTime(route.car_ready_time));
            	timetable += "<br><br>Couldn\'t determine a departure time range to catch all time windows on route";
            }  
            
            // lähtöaikahaarukkaa ei edes yritetty laskea
            else 
            	timetable += "Earliest departure at "+$scope.getRouteTimeAsString($scope.getSecondsFromTime(route.car_ready_time));
            
            timetable += "</div>";
            route.latest_start_time = route.latest_start_time.trim(); // välilyönnit pois (merkkasivat "ei tw-optimia olemassa")
            route.earliest_start_time = route.earliest_start_time.trim();
            
            // otetaan kuluvan ajan alkuarvoksi joko aikahaarukan aikaisin pää jos se on tiedossa, muuten auton aikaisin lähtöaika
            
            var elapsed_time;
            if(route.earliest_start_time == "")
            	elapsed_time = $scope.getSecondsFromTime(route.car_ready_time);
            else
                elapsed_time = $scope.getSecondsFromTime2(route.earliest_start_time);

            var initial_time = elapsed_time;	// lähtöaika talteen
            var distance_travelled = 0;
            var stopover_counter = 1;
            
            //console.log("waypoint_orderin pituus on "+selectedroute.waypoint_order.length);
            //var stringi = JSON.stringify($scope.directionsDisplay.getDirections().routes[0]);
            //console.log("JSON: "+stringi.substr(stringi.indexOf("waypoint_order")));
            
            // otetaan waypointit directionsRoute-objektista;
            // HACK ALERT!! Jos reittiviivaa suorakäsitellään, waypoint_order -taulukko tyhjenee kaikessa hiljaisuudessa (Google ei 
            // ilmeisesti halua luvata enää samaa TSP-optimia ajojärjestystä). Siksi taulukosta pidetään kopiota reittipistetaulukossa 
            // ja käytetään tarvittaessa
            
            var waypoint_order;
            var directions = route.route.routes[0];
            if(directions.waypoint_order.length == 0 && route !== null && route !== undefined && route.customers.length > 0) {
            	waypoint_order = route.waypoint_order;	// reittiviivaa on dragattu ja waypoint_order-taulukko on siksi nollaantunut -> käytetään talletettua versiota
            }
            else {	
            	waypoint_order = directions.waypoint_order;
            	route.waypoint_order = waypoint_order;	// talletetaan waypoint_order-taulukko reittitietoihin jos sellainen on
            }
            
            // käydään asiakkaat läpi ajojärjestyksessä;
            // legejä on yksi enemmän kuin asiakkaita, koska reissu alkaa ja päättyy samaan terminaaliin
            
            var customer;
            var customer_index;
            var leg;
            
            // poimitaan asiakkaat taulukosta TSP-optimoidussa järjestyksessä
            
            for(var j = 0; j < (directions.legs.length)-1; j++) {
            	
            	// onko tsp tai tw valittu? jos on niin käydään reitti läpi optimoidussa järjestyksessä
            	
            	if(route.waypoint_order.length > 0) {
            		customer_index = route.waypoint_order[j];
            		customer = route.customers[customer_index];	
            	}
            	
            	// ei ole optimoitu, käydään reitti läpi asiakasluettelon järjestyksessä
            	
            	else
            		customer = route.customers[j];
            	leg = directions.legs[j];
            	distance_travelled += leg.distance.value;	// metrejä
                elapsed_time += leg.duration.value;			// sekunteja
                timetable += "<div class=\"customer\">";
            	timetable += "<span class=\"customername\">" + customer.name+"</span><br>"+customer.address+", "+customer.city+"<br />";
            	
            	timetable += "<div class=\"eta-etd-container\">"; // class eikä id siksi että ng-bind-html poistaa id:n jostakin syystä (sanitizer säätää?)
            	
            	if(/*$scope.optimize_tw === true &&*/ (elapsed_time + 30 < $scope.getSecondsFromTime(customer.arrive_from)))
            		timetable += "<span class=\"routewarning eta\" title=\"Estimated arrival time is not within the customer\'s time window\">ETA: "+$scope.getRouteTimeAsString(elapsed_time) + " (" + $scope.getTimeDifferenceAsString(elapsed_time, $scope.getSecondsFromTime(customer.arrive_from)) + ")</span>";
            	else if(/*$scope.optimize_tw === true &&*/ (elapsed_time - 30 > $scope.getSecondsFromTime(customer.arrive_to)))
            		timetable += "<span class=\"routewarning eta\" title=\"Estimated arrival time is not within the customer\'s time window\">ETA: "+$scope.getRouteTimeAsString(elapsed_time) + " (" + $scope.getTimeDifferenceAsString(elapsed_time, $scope.getSecondsFromTime(customer.arrive_to)) + ")</span>";
            	else
            		timetable += "<span class=\"eta\">ETA: "+$scope.getRouteTimeAsString(elapsed_time) +"</span>";           
            	
            	elapsed_time += customer.duration * 60; 	// viipyminen asiakkaalla sekunteina     
            	timetable += "<br>";
            	
            	var luku1 = elapsed_time;
            	var luku2 = $scope.getSecondsFromTime(customer.arrive_to);
				//console.log("vertaillaan aikoja "+luku1+" > "+luku2);
            	
            	if(/*$scope.optimize_tw === true &&*/ (elapsed_time - 30 > $scope.getSecondsFromTime(customer.arrive_to)))
            		timetable += "<span class=\"routewarning etd\" title=\"Estimated departure time is not within the customer\'s time window\">ETD: "+$scope.getRouteTimeAsString(elapsed_time)+" (" + $scope.getTimeDifferenceAsString(elapsed_time, $scope.getSecondsFromTime(customer.arrive_to)) + ")</span>";
            	else if(/*$scope.optimize_tw === true &&*/ elapsed_time + 30 < $scope.getSecondsFromTime(customer.arrive_from))
            		timetable += "<span class=\"routewarning etd\" title=\"Estimated departure time is not within the customer\'s time window\">ETD: "+$scope.getRouteTimeAsString(elapsed_time)+" (" + $scope.getTimeDifferenceAsString(elapsed_time, $scope.getSecondsFromTime(customer.arrive_from)) + ")</span>";
            	else
            		timetable += "<span class=\"etd\">ETD: "+$scope.getRouteTimeAsString(elapsed_time) +  "</span>";
            	
            	stopover_counter++;
            	timetable += "</div></div>";
            }
            
            
            // huomioi vielä paluulegi terminaalille
            
            leg = directions.legs[j];
            elapsed_time += leg.duration.value;
            distance_travelled += leg.distance.value;
            
            if(route.customers.length > 0)
            	timetable += "<div class=\"customermeta_end\">Return to terminal<br>ETA: "+$scope.getRouteTimeAsString(elapsed_time)+"<br>Total: "+$scope.getRouteTimeAsString(elapsed_time-initial_time)+", "+precise_round((distance_travelled/1000),1)+" km</div>";
            
            timetable += "</div><div class=\"routeheader\">route end</div>";
            $scope.timetable = timetable;
        	console.log("REITTI 2 KIRJOITETTU")
        }
        
        
        
        
       
        
        
        
        
//----------------------------------------------------------------------------------------
        
        $scope.optimize_time_windows = function (origin, matrix) {
        	
        // etsii ajojärjestyksen niin että pysytään asiakkaiden aikaikkunoissa
        // origin = reittiobjekti sellaisenaan
        // matrix = distance matrix -json
        	
//---------------------------------------------------------------------------------------- 
        	
        	// laita origin-objektin asiakkaat tsp-järjestykseen mikäli tsp-järjestys on laskettu
            
        	var route = origin;
        	var optimizeBy = "distance";
            var mostOptimal = [];
            var optimized_startTime;
            
        	var sortTable = function(elements, optimalRoute) { 
        	    for (var i=0, l=elements.length; i<l; ++i) {
        	        elements[i].address = i;
                    elements[i].arrive_from = route.customers[i].arrive_from;
        	    }
                // Sort by optimizedBy attribute
        	    elements.sort(function(a,b) {
        	        return a[optimizeBy].value - b[optimizeBy].value;
        	    });
                // Sort by arrive_from-time
                if (optimalRoute.length == 0) {
                    elements.sort(function(a,b) {
                        return a.arrive_from - b.arrive_from;
                    });
                }
        	    return elements;
        	}

        	function optimize(row, time, optimalRoute) {
        		if (optimalRoute.length > mostOptimal.length) {
        			mostOptimal = optimalRoute;
        		}
        		if (optimalRoute.length >= matrix.rows.length) { console.log("Found optimal route!!"); return optimalRoute; }
        	    var ss = sortTable(matrix.rows[row].elements, optimalRoute);    
        	    //console.log("Sorttaus: ",ss);
        	    for (var i = 0; i < ss.length; i++) {
                    console.log("/// CHECKING: " + route.customers[ss[i].address].name + " IN DEPTH: " + optimalRoute.length + " FROM: " + route.customers[row].name + " : " + row + " OPTIMAL ROUTE: " + optimalRoute);
        	        if (optimalRoute.indexOf(ss[i].address) == -1) {
                        
        	            var arrive_from     = new Date(route.customers[ss[i].address].arrive_from).getTime();
        	            var arrive_to       = new Date(route.customers[ss[i].address].arrive_to).getTime();
        	            var arrive_duration = route.customers[ss[i].address].duration * 60 * 1000;
        	            var duration        = ss[i].duration.value * 1000;
                    
        	            if (optimalRoute.length == 0) {
        	            	time = +arrive_from - duration;
        	            	optimized_startTime = time;
        	            }
        	            if (time >= +arrive_from - duration) { 
                            if(+time + duration + arrive_duration <= arrive_to) {  
                                console.log("++OK: " + route.customers[ss[i].address].name + " Distance: " + ss[i].distance.text + " INDEX: " + ss[i].address + " DEPT: " + optimalRoute.length);
                                optimalRoute.push(ss[i].address)
                                var o = optimize(ss[i].address, new Date(+time + duration + arrive_duration), optimalRoute);
                                if ( o ) { return o; }
                            } else { console.log("-- TIMEISSUES, WINDOW: " + route.customers[ss[i].address].name); } 
                        }  else { console.log("-- TIMEISSUES, ARRIVE: " + route.customers[ss[i].address].name); } 
        	        } else { console.log("-- ALREADY VISITED: " + route.customers[ss[i].address].name); } 
        	    }
                optimalRoute.pop();
        	}

        	function orderRoute() {
                var finalRoute = optimize(0, new Date(route.car_ready_time), []) || mostOptimal;
                
                var customers = [];
                console.log("FinalRoute: ",finalRoute);
                for (var i=0; i < route.customers.length; i++) {
                    customers.push(route.customers[finalRoute[i]]);
                }
                
                //route.customers = customers;
                route.optimized_startTime = optimized_startTime;
                console.log("****** Alkuaikaehdotus: ", new Date(optimized_startTime));
                route.optimized_workaround = finalRoute;
                console.log("TSP-järjestys: ", route);
                /*if(optimized_startTime < car_ready_time)
                    return [finalRoute, false)
                else
                    return finalRoute, true;*/
                return finalRoute;
            }

            return orderRoute();
        }
        
        
        
        
        
        
        
        
        
        
//----------------------------------------------------------------------------------------
        
        $scope.adjustDepartureTime = function (route) {
        	
        // yrittää säätää lähtöaikaa terminaalilta niin että asiakkailla käynnit osuisivat 
        // kaikkien asiakkaiden aikaikkunoihin;
        // palauttaa aikaisimman lähtöajan ja liikkumavaran (eli lähtöaikahaarukan) jolla temppu onnistuu, 
        // palauttaa null jos aikaa ei pystytä määrittelemään
        	
        // route: reitti jonka aikataulua säädetään
        	
//----------------------------------------------------------------------------------------
        	
        	
        	        	
        	/*	Pseudokoodina:
        	 
        	   	time earliest;		// aikaisin lähtöaika
				int gap = 0;		// lähtöaikahaarukan pituus (min)
				
				loop(asiakas in kaikki asiakkaat tsp-optimilla reitillä)
					if tälle asiakkaalle saavutaan liian aikaisin
						laske tarvittava lisäaika niin että tälle asiakkalle saavuttaisiin aikaikkunan alarajalla;
						earliest += lisäaika;
						gap -= lisäaika;
					if tälle asiakkaalle saavutaan liian myöhään
						earliest = -1;
						break, tsptw-optimia ei voida muodostaa;
					gap = Math.min(gap, (aikaikkunan takaraja - todellinen lähtöaika asiakkaalta));
				end loop
        	 */
        	
        	
        	console.log("Lähtöajan säätäminen");
        	
        	if(route === undefined || route === null) {
        		return null;
        	}
        	
        	var initialtime = route.car_ready_time;
        	
        	directions = route.route.routes[0];
        	
        	var customer;
            var customer_index;
            var earliest_time = $scope.getSecondsFromTime(initialtime);	// sekunteina vuorokauden alusta
            var room = null;		// lähtöaikaikkunan leveys terminaalilta jos halutaan pysyä asiakkaiden aikaikkunoissa
            var elapsed_time = 0;	// reitin ajamiseen kulunut aika
            var time_difference;
            
            var waypoint_order = directions.waypoint_order;
            if(waypoint_order.length == 0) {
            	return null;
            }
              
            for(var j = 0; j < waypoint_order.length; j++) {
            	
            	console.log("> asiakas "+(j+1));
            	customer_index = waypoint_order[j];
            	customer = route.customers[customer_index];
            	leg = directions.legs[j];
            	
                elapsed_time += leg.duration.value;		// sekunteja
                
                console.log("> asiakkaalla klo "+$scope.getRouteTimeAsString(earliest_time + elapsed_time));
                // nyt ollaan saavuttu asiakkaalle (joko terminaalilta tai edelliseltä asiakkaalta)
            	
            	// saapuisiko asiakkaalle liian myöhään?
            	
                if(earliest_time + elapsed_time > $scope.getSecondsFromTime(customer.arrive_to)) {
                	console.log("> saavuttiin liian myöhään");
                	return null;				// ei synny tsptw:tä, ei kannata jatkaa
                }
                
                // saapuisiko asiakkaalle liian aikaisin?
                
                time_difference = $scope.getSecondsFromTime(customer.arrive_from) - (earliest_time + elapsed_time);
                
            	if(time_difference > 0) {
            		console.log("> saavuttiin liian aikaisin, myöhennetään lähtöaikaa "+time_difference+" s");
					earliest_time += time_difference;		// lähtöaikaan saman verran lisää kuin tultiin liian aikaisin;
            	}
            	
            	elapsed_time += customer.duration * 60; 	// viipyminen asiakkaalla muunnettuna sekunneiksi     
            	
            	// nyt on käyty tällä asiakkaalla ja ollaan poistumassa, katsotaan paljonko jäi aikaikkunasta käyttämättä (room)
            	// Negatiivinen arvo = myöhässä -> ei saa tsptw:tä -> ei kannata jatkaa
            	
            	if(room == null)	// ensimmäinen asiakas
            		room = $scope.getSecondsFromTime(customer.arrive_to) - (earliest_time + elapsed_time);
            	else
            		room = Math.min(room,  $scope.getSecondsFromTime(customer.arrive_to) - (earliest_time + elapsed_time));
            	
				if(time_difference > 0)
					// säädettiin lähtöaikaa myöhemmäksi, joten pienin room pieneni saman verran
					room -= time_difference;
            	
            	if(room < 0) {
            		console.log("Lähtöaikahaarukka kutistui negatiiviseksi");
            		return null;
            	}
            }
            
            
            return [earliest_time, room];
        }
        
        
        
        
        
      
        
        
        
//----------------------------------------------------------------------------------------
        
        $scope.checkTimeWindows = function (route, departuretime) {
        	
        // tarkistaa osuuko annetun reitin kaikki asiakkaat niiden aikaikkunoihin kun lähtöaika 
        // terminaalilta on departuretime
        // palauttaa aikaikkunan ulkopuolelle jäävien tilanteiden määrän (0 = TSPTW-optimi reitti)
        // tilanne tarkoittaa aikaikkunan ulkopuolella saapumista tai lähtemistä
        	
//----------------------------------------------------------------------------------------
        	
        	console.log("Reittiaikataulun tarkistus, reitti on "+route.id+", asiakkaita on "+route.customers.length);
        	
        	var directions = route.route.routes[0];
        	
        	if(directions === undefined || directions === null) {
        		return null;
        	}
        	
        	var customer;
            var customer_index;
            var elapsed_time = $scope.getSecondsFromTime(departuretime);
            
            var waypoint_order = directions.waypoint_order;
            if(waypoint_order.length == 0) {
            	return null;
            }
              
            var problems = 0;
            
            // käydään asiakkaat läpi järjestyksessä
            
            for(var j = 0; j < waypoint_order.length; j++) {
            	customer_index = waypoint_order[j];
            	customer = route.customers[customer_index];
            	leg = directions.legs[j];
                elapsed_time += leg.duration.value;		// sekunteja
            	
            	// saapuisiko asiakkaalle liian aikaisin tai liian myöhään?
            	
                console.log("customer index="+customer_index);
                console.log("customereita on "+route.customers.length);
            	if(parseInt($scope.getTimeFromSeconds(elapsed_time)) < parseInt(customer.arrive_from) || parseInt($scope.getTimeFromSeconds(elapsed_time)) > parseInt(customer.arrive_to))
            		problems++;
            	
            	elapsed_time += customer.duration*60; 	// viipyminen asiakkaalla sekunteina     
            	
            	// lähteekö asiakkaalta liian myöhään?
            	
            	if(elapsed_time > $scope.getSecondsFromTime(customer.arrive_to))
            		problems++;
            }
            
            return problems;
        	
        }
        
        
        
        
        
        
        
        
        
        
//----------------------------------------------------------------------------------------
        
        $scope.calculateRouteDistanceAndDuration = function (route) {
        	
        // laskee reitin pituuden ja keston uudelleen kun aktiivista reittiä muutetaan
        // route: delivery_routes -taulukon alkio 
        	
//----------------------------------------------------------------------------------------

        	// myös uuden reitin laskennan käynnistyminen triggaa tämän, eli mitään reittiä 
        	// ei siinä vaiheessa ole mitä mitata
        	      	
        	if(route === undefined) 
        		{
        		return [0,0];
        		}

        	var directions = route.route.routes[0];	// otetaan reitin DirectionsResult-olio
        	if(directions === null || directions === undefined)
        		return [0,0];
        	
        	console.log("Reitin pituuden laskenta");
        	var RouteDistance = 0;
            var TotalDuration = 0;            
            
            // lasketaan legien ajamiseen kuluva aika
            
            for(var i = 0; i < directions.legs.length; i++) {
                RouteDistance += directions.legs[i].distance.value;
                TotalDuration += directions.legs[i].duration.value;
            }           
            
            // lisätään asiakkailla kuluva aika
            
            for(var j = 0; j < route.customers.length; j++) {
                var stopover = route.customers[j];
                if(stopover.route_number == route.id) {    // tämä asiakas kuuluu reittiin
                    TotalDuration += stopover.duration*60;                 // minuutit sekunneiksi
                }
            }
            
            return [RouteDistance, TotalDuration];
        }

        
        
        
        
        
        
        
//----------------------------------------------------------------------------------------
        
        $scope.setRouteDistanceAndTime = function (route) {
        	
        // asettaa lasketun reittimatkan ja -ajan UI:hin
        // route = joku reitti reittitaulukosta
	
//----------------------------------------------------------------------------------------

        	var newDistanceAndTime = $scope.calculateRouteDistanceAndDuration(route);
    
        	$scope.route_distance = newDistanceAndTime[0];
        	$scope.route_duration = newDistanceAndTime[1];
}

    
        
        
        
    
        
    
//----------------------------------------------------------------------------------------

    var precise_round = function (num,decimals) {

    // lyhentää ja pyöristää luvun num annettuun määrään desimaaleja
    // esim. (3.5365, 2) -> 3.54
    	
//----------------------------------------------------------------------------------------
    	
    	return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
    }



    
       

   
    

   
//----------------------------------------------------------------------------------------
    
    $scope.routeSelected = function () {
    	
    // tämä suoritetaan aina kun reitti valitaan kälissä, ottaa reitin ja auton tiedot käyttöön
    	
//----------------------------------------------------------------------------------------
    	
    	// valittu "ei mitään reittiä", putsaa käli edellisestä reitistä ja sen tiedoista
    	
    	if($scope.selected_route === undefined || $scope.selected_route === null) {
    		$scope.resetUI();
    		return;
    	}
    	
    	
    	/*var customer_json = JSON.stringify($scope.selected_route);
    	localStorage.setItem("reitti-json", customer_json);*/
    	
    	// ollaanko tekemässä uutta reittiä eikä reitin alkupistettä ole vielä annettu?
    	
    	if($scope.selected_route.terminal_address.length == 0) {
    		
    		// resetoidaan reittiaikataulu
    		$scope.setRouteTimetable2($scope.selected_route);
    		
    		// edellisen reitin reittiviiva pois kartalta
    		$scope.directionsDisplay.setMap(null);
    		
    		// resetoidaan siltaikonit
    		console.log("Resetoidaan sillat");
    		for(var i = 0; i < $scope.bridges.length; i++) {
        		if($scope.bridges[i].type == "bridge")
        			$scope.bridges[i].setIcon("kuvat/bridge.png");	// asetetaan normaali siltaikoni näkyviin
        	}
    		return;
    	}
    	
    	    	
   		//$scope.directionsDisplay.setMap($scope.map);	// asetetaan reittiviiva näkyviin siltä varalta että ei jo ole
    	
    	// lasketaan tälle reittiobjektille reitti jos sitä ei vielä ole
    	
    	//if($scope.selected_route.route === null || $scope.selected_route.route === undefined) {
    		console.log("Valittiin reitti, lasketaan...");
    		$scope.calculateRoute(null);
    		
    	//	return;
    	//}
    	
    	// aseta reittiviiva näkyviin jos tälle reittiobjektille on sellainen jo laskettu
    	
    	$scope.car_id = $scope.selected_route.car_id;
    	$scope.force_apply_hack = false;
    	//$scope.directionsDisplay.setDirections($scope.selected_route.route); 
    }
    	
    	
    	
    
    
    
    
    
    
    	
//----------------------------------------------------------------------------------------    	
    
    $scope.convertDirectionsResponse = function(directionsRequest, data) {
    	
    // muuttaa REST-muotoisen reititysresultin directionsResponse-muotoon;
    // muuttaa alkuperäistä dataa;
    // directionsRequest = directionsRequest-objekti jolla saatu reitti
    // pyydettiin (tai olisi voitu käyttää, sitähän ei tarvita REST-rajapinnassa);
    // data = REST-reititysresultti	
    	
//----------------------------------------------------------------------------------------
    	
    	//console.log("convertDirectionsResponse, data=",data);
    	
    	data.cc = directionsRequest;	// tämä kenttä (Pb, Nb, cc, ic jne...) muuttaa nimeään kun Google muuttaa APIa ja minimoi skriptin uudelleen; tarttee siis korjailla tätä aina silloin tällöin
    	data.routes[0].overview_path = google.maps.geometry.encoding.decodePath(data.routes[0].overview_polyline.points);
    	var bounds = new google.maps.LatLngBounds(new google.maps.LatLng(data.routes[0].bounds.southwest.lat, data.routes[0].bounds.southwest.lng), new google.maps.LatLng(data.routes[0].bounds.northeast.lat, data.routes[0].bounds.northeast.lng));
    	data.routes[0].bounds = bounds;
    	
    	for(var i = 0; i < data.routes[0].legs.length; i++) {
    		var lng = data.routes[0].legs[i].end_location.lng;
    		var lat = data.routes[0].legs[i].end_location.lat;
    		data.routes[0].legs[i].end_location = new google.maps.LatLng(lat, lng);
    		
    		lng = data.routes[0].legs[i].start_location.lng;
    		lat = data.routes[0].legs[i].start_location.lat;
    		data.routes[0].legs[i].start_location = new google.maps.LatLng(lat, lng);
    		
    		data.routes[0].legs[i].via_waypoints = [];
    		
    		for(var j = 0; j < data.routes[0].legs[i].steps.length; j++) {
    			lng = data.routes[0].legs[i].steps[j].end_location.lng;
    			lat = data.routes[0].legs[i].steps[j].end_location.lat;
    			data.routes[0].legs[i].steps[j].end_location = new google.maps.LatLng(lat, lng);
    			                    		
        		lng = data.routes[0].legs[i].steps[j].start_location.lng;
        		lat = data.routes[0].legs[i].steps[j].start_location.lat;
        		data.routes[0].legs[i].steps[j].start_location = new google.maps.LatLng(lat, lng);
        		
        		data.routes[0].legs[i].steps[j].encoded_lat_lngs = data.routes[0].legs[i].steps[j].polyline.points;
        		data.routes[0].legs[i].steps[j].maneuver = "";
        		
        		data.routes[0].legs[i].steps[j].lat_lngs = google.maps.geometry.encoding.decodePath(data.routes[0].legs[i].steps[j].encoded_lat_lngs);
        		
        		var path = []; 
        		for(var k = 0; k < data.routes[0].legs[i].steps[j].lat_lngs.length; k++) {
        			path[k] = new google.maps.LatLng(data.routes[0].legs[i].steps[j].lat_lngs[k].lat(), data.routes[0].legs[i].steps[j].lat_lngs[k].lng());
        		}
        		//data.routes[0].legs[i].steps[j].lat_lngs;
        		data.routes[0].legs[i].steps[j].path = path;
        		
    		}
    	}
    	
    }
    
    
    
    
    
    
    
    
//----------------------------------------------------------------------------------------
    
    
    $scope.getDirectionsRequestURLforREST = function(directionsRequest) {
    	
    // muodostaa REST API -kutsua varten URL:n, jossa on koodattuna directionsRequestin 
    // tiedot
    // directionsRequest = DirectionsRequest -pyyntö josta tiedot luetaan
	
//----------------------------------------------------------------------------------------
    	
    var url = "/maps/api/directions/json?origin=";
	url += directionsRequest.origin;
	url += "&destination="+directionsRequest.destination;
	url +="&waypoints=";
	url += "optimize:"+directionsRequest.optimizeWaypoints+"|";
	
	for(var i = 0; i < directionsRequest.waypoints.length; i++) {
		var waypoint = directionsRequest.waypoints[i];
		if(i > 0)
			url += "|";
		if(waypoint.stopover === true) {}
		url += waypoint.location;
	}
	
	url += "&sensor=false&language=fi-FI&channel=gapps";
	console.log("URL: "+url);
	return url;
}






    
    
    
//----------------------------------------------------------------------------------------
    
    $scope.calculateRoute = function (request) {
    	
    // etsii reitin (kun calculate route -nappia klikataan)
    	
//----------------------------------------------------------------------------------------
    	
    	console.log(">>> Aloitetaan reititys");
    	        
        if($scope.selected_route === undefined || $scope.selected_route === null)
        	return;
        
        //$scope.route_weight_restriction = max_weight_on_road;
        //$scope.route_height_restriction = max_height_on_road;
        
        // siirretään reitin pysähdyspaikat aputaulukkoon...

        /*var temp_array = $scope.getWaypoints($scope.selected_route).trim().split(';');
        temp_array.splice(temp_array.length-1, 1);*/	// lopussa on aina tyhjä elementti, heitetään se pois
        
        /*address: "Ratsumiehenkatu 8",
	    post_code: "20880",
	    city: "TURKU",*/
	    
        // ...ja siirretään tiedot aputaulukosta toiseen taulukkoon täydennettynä merkinnällä välipysähdystarpeesta
        
        var temp_array = $scope.getWaypoints($scope.selected_route);
        var stopover_array = [];
        
        for(var i = 0; i < temp_array.length; i++) {

            if(temp_array[i].length < 1)	// skippaa mahdollinen tyhjä elementti
                continue;
            
            stopover_array[i] = {
                    location: temp_array[i].address+","+temp_array[i].post_code+","+temp_array[i].city,
                    stopover: true};
        }
                
        // tuupataan välipisteet reitityspyyntöön
        
        var directionsRequest;
        
        if(request == null)	{	// tehdään uusi pyyntöobjekti jos parametrina tuli nullia
        	directionsRequest = {
                origin: "",
                destination: "",
                waypoints: $scope.waypoints_array,
                optimizeWaypoints: $scope.optimize_tsp,
                provideRouteAlternatives: false,
                durationInTraffic: true,
                travelMode: google.maps.DirectionsTravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.METRIC
            };
        	directionsRequest.waypoints = stopover_array;
            directionsRequest.origin = $scope.selected_route.terminal_address;
            directionsRequest.destination = $scope.selected_route.terminal_address;
        }
        else
        	directionsRequest = request;
               
        if(directionsRequest.origin === undefined || directionsRequest.origin.length == 0)
        	return;
        
        $scope.hideArrows();	// hävitetään mahdolliset edellisen näytetyn reittiviivan suuntanuolet

        // Pyydä reitti annetusta lähtöpisteestä päätepisteeseen kulkien annettujen pisteiden kautta;
        // Tämän laskennan tulos sisältää aina vain yhden reittivaihtoehdon, jos on annettu yksikin välipysähdyspaikka (stopover)
        // HUOM: tämä heittää directions_changed -eventin, jolle on kuuntelija ylempänä
        
        // 25 pisteen versio, laita parametrit urliin ja heitä ajax-pyyntö:
        // Please use https://fleximap.maptoweb.dk to relay any Google requests that is required for testing the 25 waypoints. 
        // Below is an example of a directions request without waypoints. Just add waypoints as you see fit.
        // https://fleximap.maptoweb.dk/maps/api/directions/json?origin=Toronto&destination=Montreal&sensor=false&channel=gapps

        //It is important that you add the channel=gapps parameter to all requests to the service. Otherwise they will be denied.
        
        var business_licence = false;
        
        // business-lisenssillä:
        
        if(business_licence === true) {
        	var url = $scope.getDirectionsRequestURLforREST(directionsRequest);
        	
        
        
        // https://fleximap.maptoweb.dk/maps/api/directions/json?origin=Avantintie 29, 21420 Lieto, Finland
        // &destination=Avantintie 29, 21420 Lieto, Finland&waypoints=optimize:true
        // |via:Merimaskuntie 101,21160,MERIMASKU|via:Tuulensuunkatu 6,21100,Naantali|via:NUHJALANTIE 8,21110,NAANTALI
        // |via:MATKAILIJANTIE 2,21100,NAANTALI|via:Matkailijantie 2,21100,Naantali|via:EMÄNNÄNKATU 5,21100,NAANTALI
        // |via:KESKUSKAARI 5,21250,MASKU&sensor=false&channel=gapps
        
        	
      //---------------- reittipyyntö lähtee (business) -----------------------
        	
        var responsePromise = $http.get(encodeURI(url));	// directionsRequest urliin koodattuna proxyn kautta Googlelle
        
        responsePromise.success(function (data, status, headers, config) {

        	// vastaus ok, lue reitti ja piirrä kartalle

        	console.log("AJAX success");
        	console.log("REST result: %o", data);
        	$scope.force_apply_hack = false;
            
        	// kasataan REST-reittiresultista directionsResult-objekti
                	
        	$scope.convertDirectionsResponse(directionsRequest, data);
        	//console.log("Convertoitu data: ", data);
                	
            console.log("Asetetaan reitti reittikuvaukseen");
            $scope.selected_route.route = data; // asetetaan käytössä olevaksi reitiksi (ei piirrä eikä triggaa mitään)
            $scope.selected_route.latest_start_time = "";	// nollataan lähtöaikaikkuna, nämä katsotaan myöhemmin
    		$scope.selected_route.earliest_start_time = "";
    		
            if($scope.optimize_tw === false) {
                		
                // ei haluta tw-uudelleenjärjestelyä reittiin
                		
                console.log("Ei aikaikkunaoptimointia haluttu");
                		
                // katsotaan miten aikaikkunoiden ja lähtöaikahaarukan kanssa käy
                
                var tsptw = $scope.adjustDepartureTime($scope.selected_route);
                if(tsptw === null) {
                	   console.log("Reitistä ei saa TSPTW-optimia pelkästään lähtöaikaa säätämällä");
                }
                else {
                	   $scope.selected_route.latest_start_time = $scope.getTimeFromSeconds(tsptw[0]+tsptw[1]);
                	   $scope.selected_route.earliest_start_time = $scope.getTimeFromSeconds(tsptw[0]);	
                }
                   
                console.log("Piirretään reitti kartalle");
                   
                // Jos seuraava koodirivi alkaa heittämään erroria ilman mitään tehtyjä muutoksia koodiin, on kyse 
                // siitä että jokin kenttä directionsResult-objektissa on muuttanut nimeään, todennäköisesti 
                // directionsRequest-objektin kenttä joka on objektissa ensimmäisenä (ollut mm. Tb ja Pb). Ota silloin 
                // directionsResult-objekti localStoragesta (key = keslog_result_directionsResult_nobusiness) ja katso 
                // mikä muuttujan nimi tällä kertaa on. Syy tähän kaikkeen on se että Google on modannut Maps-kirjastoja 
                // ja minimoinnin tuloksena kentillä on uudet nimet.
                $scope.directionsDisplay.setDirections(data);	// jos hajoaa tässä, lue ohje yläpuolelta
                $scope.drawRouteMarkers(data);
                $scope.addCustomerClickListeners($scope.selected_route);
                console.log("Business-reitin asetus tehty");
                return;
            }
                	                	
            // ------------------  tw-optimointi tehdään tässä  ------------------------
                	
            else {
                		
            	// lasketaan aikaikkunoihin osumattomuudet

            	console.log("Aikaikkunaoptimointi alkaa");
                		
                    	/*var tw-problems = $scope.checkTimeWindows($scope.selected_route, $scope.selected_route.car_ready_time);
                        if(tw-problems == 0) {
                        	console.log("Reitti on TSPTW-optimi, voidaan piirtää");
                        	$scope.directionsDisplay.setDirections(data);	// laita reitti näkyviin kartalle
                			//$scope.drawRouteMarkers(data);  // funktio on kesken
                			console.log("Business-reitin asetus tehty");
                        }
                        else {
                        		console.log("Reitti ei ole TSPTW-optimi");*/
                        	
                		
                        // katsotaan mahdollisuudet muuttaa ensimmäisellä yrittämällä saatu reitti TSPTW:ksi jos se ei sitä ole; jos on TSPTW, lasketaan lähtöaikaikkuna
                        	
            	var tsptw = $scope.adjustDepartureTime($scope.selected_route);
                        
                if(tsptw === null) {
                	console.log("Reitistä ei saa TSPTW-optimia pelkästään lähtöaikaa säätämällä");
                    $scope.selected_route.latest_start_time = "";
                    $scope.selected_route.earliest_start_time = "";
                    console.log("Uudelleenjärjestellään reittiä");
                    		
                    //---------------- tw-uudelleenreitityskoodi ----------------
                    		
                    // ensin tarvitaan distance matrix apista etäisyystaulukko
                    		
                    var matrix_url = $scope.getMatrixRequestURL($scope.selected_route);
                    		
                    var responsePromise = $http.get(encodeURI(matrix_url));         
                    responsePromise.success(function (data_matrix, status, headers, config) {
                            
                    //------------------- MATRIX CALLBACK ALKAA --------------------
                        
                    	// Matrix-resultti on Chromessa ja IE:ssä sama
                    	
                    	// Jos Distance Matrix APIn quota on ylitetty, otetaan resultti localStoragesta
                            	
                        if(data_matrix.status == "OVER_QUERY_LIMIT") {
                            		data_matrix = JSON.parse(localStorage.getItem("keslog-matrix-"+$scope.selected_route.id));
                            		//data = eval(localStorage.getItem("keslog-matrix-"+route.id));
                            		console.log("Storagesta ulos: ", data_matrix);
                            		console.log("** Distance Matrix API OVER_QUERY_LIMIT, otetaan vanha versio välimuistista");
                            		// console.log("Distance Matrix result: ", data_matrix);
                        }
                            	
                        else if(data_matrix.status == "OK") {
                            		// laitetaan matrix resultti talteen over quotan varalle
                            		//localStorage.setItem("keslog-matrix-"+$scope.selected_route.id, JSON.stringify(data_matrix));
                            		console.log("Distance Matrix result on OK");
                        }
                            	
                            	// Nyt tiedetään etäisyydet reitin kaikilta asiakkailta reitin kaikille asiakkaille -> katsotaan aikaikkunat
                            	
                        var tw_result = $scope.optimize_time_windows($scope.selected_route, data_matrix);
                        console.log("TW-result: ",tw_result);
                            	
                            	// jos aikaikkunaoptimointi ei antanut tulosta, reitti piirretään kartalle 
                            	
                        if(tw_result === null || tw_result === undefined || tw_result.length == 0) {
                            		console.log("tw-optimointi tehty, tw-optimointi ei antanut tulosta, piirretään reitti kartalle");
                            		$scope.selected_route.latest_start_time = " ";	// = ei tw-optimia olemassa tälle reitille
                            		$scope.selected_route.earliest_start_time = " ";
                            		$scope.directionsDisplay.setDirections(data);	// laita edellä laskettu reitti näkyviin kartalle
                                    $scope.drawRouteMarkers(data);
                                    $scope.addCustomerClickListeners($scope.selected_route);
                                    console.log("Business-reitin asetus tehty");
                                    return;
                        }
                            	
                            	// aikaikkunaoptimointi on olemassa;
                            	// nyt laitetaan toinen reittipyyntö ulos tw_resultin näyttämässä järjestyksessä ja piirretään vasta se reitti
                            	
                            	// tämä pyyntö tehdään AINA ilman tsp:tä eli optimizeWaypoints = false, koska asiakkaiden järjestys ei saa tassä enää muuttua
                            	
                        var directionsRequest2 = {
                                        origin: $scope.selected_route.terminal_address,
                                        destination: $scope.selected_route.terminal_address,
                                        waypoints: [],
                                        optimizeWaypoints: false,
                                        provideRouteAlternatives: false,
                                        durationInTraffic: false,
                                        travelMode: google.maps.DirectionsTravelMode.DRIVING,
                                        unitSystem: google.maps.UnitSystem.METRIC
                                    };
                            	
                            	// ladotaan asiakkaat välipysähdystaulukkoon tw-optimoidussa järjestyksessä
                            	
                            	var stopover_array2 = [];
                            	for(var index2 = 0; index2 < tw_result.length; index2++) {
                                    stopover_array2[index2] = {
                                            location: $scope.selected_route.customers[tw_result[index2]].address+","+$scope.selected_route.customers[tw_result[index2]].post_code+","+$scope.selected_route.customers[tw_result[index2]].city,
                                            stopover: true};
                                }
                            	directionsRequest2.waypoints = stopover_array2;
                            	console.log("DIRECTIONS REQUEST (tw-järjestys): ", directionsRequest2);
                            	var url2 = $scope.getDirectionsRequestURLforREST(directionsRequest2);
                            	
                            	// lähetä reitityspyyntö
                            	
                            	var responsePromise = $http.get(encodeURI(url2));	// directionsRequest urliin koodattuna proxyn kautta Googlelle
                            	
                            	//------------------- TW-ROUTE CALLBACK ALKAA -------------------- 
                            	
                                responsePromise.success(function (data2, status, headers, config) {

                                	// vastaus ok, lue reitti ja piirrä kartalle

                                	console.log("AJAX success 2");
                                	console.log("REST result 2: %o", data2);
                                	
                                    // kasataan REST-reittiresultista directionsResult-objekti
                                        	
                                    $scope.convertDirectionsResponse(directionsRequest2, data2);         
                                    $scope.force_apply_hack = false;  
                                    
                                    console.log("Asetetaan lopullinen tw-reitti reittikuvaukseen");
                                    $scope.selected_route.route = data2;
                                    $scope.selected_route.route.routes[0].waypoint_order = tw_result;	// vaihdetaan tsp-järjestyksen tilalle tw-järjestys
                                    
                                    var tsptw2 = $scope.adjustDepartureTime($scope.selected_route);
                                    if(tsptw2 !== null)
                                    {
                                		console.log("Viimeinen reittiversio on TSPTW-optimi jos lähtöaika on "+$scope.getRouteTimeAsString(tsptw2[0])+"..."+$scope.getRouteTimeAsString(tsptw2[0]+tsptw2[1]));    			
                                		$scope.selected_route.latest_start_time = $scope.getTimeFromSeconds(tsptw2[0]+tsptw2[1]);
                                		$scope.selected_route.earliest_start_time = $scope.getTimeFromSeconds(tsptw2[0]);
                                		
                                    }
                                    else {
                                    	console.log("********* Viimeinen reitti ei antanut lähtöaikahaarukkaa vaikka pitäisi olla TW-optimi; laskettu lähtöaika on siis kelvoton");
                                    	/*$scope.selected_route.latest_start_time = "";
                                		$scope.selected_route.earliest_start_time = "";*/
                                    }
                                    
                                    console.log("tw-optimointi tehty, piirretään reitti kartalle");
                                    $scope.selected_route.route = data2;			// aseta reitti reittikuvaukseen
                                    $scope.directionsDisplay.setDirections(data2);	// laita reitti näkyviin kartalle
                                    $scope.drawRouteMarkers(data2);
                                    $scope.addCustomerClickListeners($scope.selected_route);
                                    console.log("Business-reitin asetus tehty");
                                });
                                
                                responsePromise.error(function (data2, status, headers, config) {

                                	// listan lukeminen feilasi
                                	console.log("AJAX failure, status="+status);
                                	if(status == google.maps.DirectionsStatus.NOT_FOUND) {
                                		alert("Can\'t find at least one address, please check the addresses and try again.");
                                	 }
                                	 else if(status == google.maps.DirectionsStatus.ZERO_RESULTS) {
                                	 alert("No routes, please check or change the addresses.");            
                                	 }
                                	 else if (status == google.maps.DirectionsStatus.INVALID_REQUEST) {
                                	 alert("Software error, the server blamed the request as \"invalid\"");            
                                	 }
                                	 else if (status == google.maps.DirectionsStatus.MAX_WAYPOINTS_EXCEEDED) {
                                	 alert("Too many waypoints between origin and destination, please drop some and try again.");            
                                	 }
                                	 else if (status == google.maps.DirectionsStatus.OVER_QUERY_LIMIT) {
                                	 alert("You have exceeded your query limit, please wait for a while and try again.");            
                                	 }
                                	 else if (status == google.maps.DirectionsStatus.REQUEST_DENIED) {
                                	 alert("You are not allowed to use the routing services.");            
                                	 }
                                	 else if (status == google.maps.DirectionsStatus.UNKNOWN_ERROR) {
                                	 alert("Sorry, internal server error prevented the routing, please try again.");            
                                	 }
                                	 else
                                	 alert("Sorry, routing has failed: "+status);
                                	});
                                
                            	//------------------- TW-ROUTE CALLBACK LOPPUU -------------------- 

                                
                            	//------------------- MATRIX CALLBACK LOPPUU --------------------
                            	
                    	});
                            
                            // Matrix-AJAXin error:
                            responsePromise.error(function (data, status, headers, config) {
                            	alert("Network error, can\'t route now. Please try again later.");
                            	return;
                            });
                    	}
                            
                    	else {  // tsptw !== null
                    		console.log("Reitti on ilman uudelleenjärjestelyä TSPTW-optimi jos lähtöaika on "+$scope.getRouteTimeAsString(tsptw[0])+"..."+$scope.getRouteTimeAsString(tsptw[0]+tsptw[1]));    			
                    		$scope.selected_route.latest_start_time = $scope.getTimeFromSeconds(tsptw[0]+tsptw[1]);
                    		$scope.selected_route.earliest_start_time = $scope.getTimeFromSeconds(tsptw[0]);
                    		console.log("tw-optimointi tehty, piirretään reitti kartalle");
                			$scope.directionsDisplay.setDirections(data);	// laita reitti näkyviin kartalle
                			$scope.drawRouteMarkers(data); 
                			$scope.addCustomerClickListeners($scope.selected_route);
                			console.log("Business-reitin asetus tehty");
                			return;
                    	}
                    	
                    	
                			
                			/*
                			console.log("tw-optimointi tehty, piirretään reitti kartalle");
                			$scope.directionsDisplay.setDirections(data);	// laita reitti näkyviin kartalle
                			//$scope.drawRouteMarkers(data);  // funktio on kesken
                			console.log("Business-reitin asetus tehty");
                			return;
                		    */
                    	   
                } // optimize_tw === true	
                	
        }); // responsePromise.success() päättyi
        
        responsePromise.error(function (data, status, headers, config) {

        	// listan lukeminen feilasi
        	console.log("AJAX failure, status="+status);
        	if(status == google.maps.DirectionsStatus.NOT_FOUND) {
        		alert("Can\'t find at least one address, please check the addresses and try again.");
        	 }
        	 else if(status == google.maps.DirectionsStatus.ZERO_RESULTS) {
        	 alert("No routes, please check or change the addresses.");            
        	 }
        	 else if (status == google.maps.DirectionsStatus.INVALID_REQUEST) {
        	 alert("Software error, the server blamed the request as \"invalid\"");            
        	 }
        	 else if (status == google.maps.DirectionsStatus.MAX_WAYPOINTS_EXCEEDED) {
        	 alert("Too many waypoints between origin and destination, please drop some and try again.");            
        	 }
        	 else if (status == google.maps.DirectionsStatus.OVER_QUERY_LIMIT) {
        	 alert("You have exceeded your query limit, please wait for a while and try again.");            
        	 }
        	 else if (status == google.maps.DirectionsStatus.REQUEST_DENIED) {
        	 alert("You are not allowed to use the routing services.");            
        	 }
        	 else if (status == google.maps.DirectionsStatus.UNKNOWN_ERROR) {
        	 alert("Sorry, internal server error prevented the routing, please try again.");            
        	 }
        	 else
        	 alert("Sorry, routing has failed for a reason that is outside of this application: "+status);
        	});

        
        } // if(business_licence === true)
        
        
        
        // ei business-lisenssiä
        
        else {	
        
        $scope.directionsService.route(directionsRequest, function(response, status) {
        	
            if(status == google.maps.DirectionsStatus.OK) {
            	console.log(">>> Reitti laskettu");

            	console.log("DirectionsResult: ", JSON.stringify(response));          	
            	localStorage.setItem("keslog_result_directionsResult_nobusiness", JSON.stringify(response));	// tallentaa directionsResponse-objektin localStorageen

            	$scope.selected_route.route = response;				// laita talteen reitin tietoihin
            	$scope.force_apply_hack = true; 
            	$scope.directionsDisplay.setDirections(response);	// laita näkyviin kartalle
            	$scope.drawRouteMarkers(response);
            	$scope.addCustomerClickListeners($scope.selected_route);
            	$scope.drawArrowsOnRoute($scope.selected_route);
            }
            else if(status == google.maps.DirectionsStatus.NOT_FOUND) {
            	alert("Can\'t find at least one address, please check the addresses and try again.");
            }
            else if(status == google.maps.DirectionsStatus.ZERO_RESULTS) {
            	alert("No routes, please check or change the addresses.");            
            }
            else if (status == google.maps.DirectionsStatus.INVALID_REQUEST) {
            	alert("Software error, the server blamed the request as \"invalid\"");            
            }
            else if (status == google.maps.DirectionsStatus.MAX_WAYPOINTS_EXCEEDED) {
            	alert("Too many waypoints between origin and destination, please drop some and try again.");            
            }
            else if (status == google.maps.DirectionsStatus.OVER_QUERY_LIMIT) {
            	alert("You have exceeded your query limit, please wait for a while and try again.");            
            }
            else if (status == google.maps.DirectionsStatus.REQUEST_DENIED) {
            	alert("You are not allowed to use the routing services.");            
            }
            else if (status == google.maps.DirectionsStatus.UNKNOWN_ERROR) {
            	alert("Sorry, internal server error prevented the routing, please try again.");            
            }
            else
           	 	alert("Sorry, routing has failed for a reason that is outside of this application: "+status);

            console.log(">>> Reititys tehty");
        
        	}); // route():n callback
        }
        

    }

    
    

    
    
    
  //----------------------------------------------------------------------------------------

    $scope.drawRouteMarkers = function (directionsresponse) {
    	
    // piirtää reitin markkerit kartalle
    // route: käytössä oleva reitti
    	
//----------------------------------------------------------------------------------------
    	
    	
    	
    	var legs = directionsresponse.routes[0].legs;
    	
    	for(var i = 0; i < legs.length; i++) {
    		
    		var leg = legs[i];
    		if(i == 0) {
    			
    			// terminaalin ikoni
    			
    			var image = $scope.image_path + $scope.selected_route.terminal_icon;
    		    var pos = leg.start_location;
    			var terminalMarker = new google.maps.Marker({
    			    position: pos,
    			    map: $scope.map,
    			    icon: image,
    			    optimized: false,
    			    callback: null,
    			    zIndex: 900
    			  });
    			
    			var infotext = "<span class='infowindowheader'>Terminaali</span>";
    			infotext += "<span class='infowindowtext'>"+leg.start_address+"</span>";
    			
    			/*
    			 * var func = function() {
        		
        		// jos infoWindow on jo auki, suljetaan se

        		if(this.infowindow !== undefined && this.infowindow.is_open === true) {
        			this.infowindow.is_open = false;
        			this.infowindow.close();
        			return;
        		}
        		
        		// tämä infoWindow aukeaa kun markkeria klikataan
        		// asdf
        		this.infowindow = new google.maps.InfoWindow({
        			maxWidth: 300,
        			content: infotext,
        			is_open: false
        		});
        		
        		// lisätään kuuntelija infoWindown close-napille, jotta toggle toimii sen 
        		// painamisen jälkeenkin oikein (eli is_open vaihtuu falseksi)
        		
        		google.maps.event.addListener(this.infowindow,'closeclick',function(){
        			this.is_open = false;
        			this.close();
        		});
        		
        		this.infowindow.is_open = true;
        		this.infowindow.open($scope.map, marker);
        	}
        	
        	// asetetaan yo. funktio markkeriin callback-funktioksi kun markkeria klikataan
        	marker.callback = func;
        	
        	// aseta klikkausten kuuntelija, joka triggaa callbackin markkerista
        	google.maps.event.addListener(marker, 'click', func);

        };
    			 */
    			var callback = function() { // asd
            		
    				if(this.infowindow !== undefined && this.infowindow.is_open === true) {
    					this.infowindow.close();
            			this.infowindow.is_open = false;
            			return;
    				}
    				
    				this.infowindow = new google.maps.InfoWindow({
            			//maxWidth: 300,
            			content: infotext,
            			is_open: false
            		});
    				
            		if(terminalMarker.infowindow_open == false) {
            			
            			this.is_open = true;
            		}
            		
            		google.maps.event.addListener(this.infowindow,'closeclick',function(){
        				this.is_open = false;
        				this.close();
            		});
            		
            		this.infowindow.is_open = true;
            		this.infowindow.open($scope.map, terminalMarker);
                };
                
                terminalMarker.callback = callback;
    			google.maps.event.addListener(terminalMarker, 'click', callback);
    			
    			
    		}
    		
    		// sitten piirretään asiakkaiden markkerit
    		
    		if(i < legs.length-1) {
    			
    			/*var terminalMarker = new google.maps.Marker({
    			    position: leg.end_location,
    			    map: $scope.map,
    			    //icon: image,
    			    optimized: false,
    			    callback: null,
    			    draggable: true,
    			  });*/
    		}
    		
    	} 
    }
    
    
    
    
    
//----------------------------------------------------------------------------------------

    $scope.getRouteTimeAsString = function (duration) {
    	
    // muuntaa sekunnit stringiksi muotoon h:mm
    // Jos läjä sekunteja on esimerkiksi sama kuin 1 h 22 min 24 s, palauttaa tämä funktio "1:22".
    // Duration: sekunnit
    	
//----------------------------------------------------------------------------------------

        var hours = +duration / 3600;
        var minutes = 60 * (hours - Math.floor(hours));
        var seconds = minutes - Math.floor(minutes);
        if(seconds > 0.5)
            minutes++;
        if(minutes > 59) {
            minutes = 0;
            hours++;
        }
        minutes = Math.floor(minutes);
        if(minutes < 10)
            minutes = "0"+minutes;
        return ""+Math.floor(hours)+":"+minutes;
    }
    
    
    
    
    
    
    
  //----------------------------------------------------------------------------------------

    $scope.getTimeDifferenceAsString = function (duration1, duration2) {
    	
    // Laskee duration2 - duration1 ja muuntaa erotuksen stringiksi 
    // muotoon h:mm, eteen tulee + tai -. 
    // Duration1: sekunnit
    // Duration2: sekunnit
    	
//----------------------------------------------------------------------------------------

    	var duration = duration2 - duration1;
    	if(duration < 0)
    		duration = -duration;
    	
        var hours = +duration / 3600;
        var minutes = 60 * (hours - Math.floor(hours));
        var seconds = minutes - Math.floor(minutes);
        if(seconds > 0.5)
            minutes++;
        if(minutes == 60) {
            minutes = 0;
            hours++;
        }
        minutes = Math.floor(minutes);
        if(minutes < 10)
            minutes = "0"+minutes;
        if(duration1 > duration2)
        	return "+"+Math.floor(hours)+":"+minutes;
        else
        	return "-"+Math.floor(hours)+":"+minutes;
    }
    
    



    
  
    
    
//----------------------------------------------------------------------------------------

    $scope.getSecondsFromTime = function (time) {
    	
    // muuntaa ajan muodosta Date() sekunneiksi
    	
//----------------------------------------------------------------------------------------
    	
    	if(time === null)
    		return 0;
    	
    	/*var hours = parseInt(time.substr(0,2));
    	var mins = parseInt(time.substr(2,2));
    	var minutes = 60*hours;
    	minutes = minutes + mins;
    	return 60*minutes;*/
    	
    	var hours = time.getHours();
    	var mins = time.getMinutes() + (60*hours);
    	
    	return 60 * mins;	// sekunnit
    	
    }
    
    
    
    
    
    
    
  //----------------------------------------------------------------------------------------

    $scope.getSecondsFromTime2 = function (time) {
    	
    // muuntaa ajan muodosta hhmm sekunneiksi
    	
//----------------------------------------------------------------------------------------
    	
    	var hours = parseInt(time.substr(0,2));
    	var mins = parseInt(time.substr(2,2));
    	var minutes = 60*hours;
    	minutes = minutes + mins;
    	
    	return 60*minutes;
    	
    	
    	
    }
    
    
    
   
    
    
        
    
    
//----------------------------------------------------------------------------------------

    $scope.getTimeFromSeconds = function (seconds) {
    	
    // antaa sekunneista ajan stringinä muodossa "hhmm", aina 4 numeroa
    	
//----------------------------------------------------------------------------------------
    	
    	minutes = Math.round(parseInt(seconds)/60);
    	var hours = Math.floor(minutes/60);
    	if(hours < 10)
    		hours = "0"+hours;
    	var mins = minutes % 60;
    	if(mins < 10)
    		mins = "0"+mins;
    	return ""+hours+""+mins;
    }
    
    
    
    
    
    
    
    
    
    
//----------------------------------------------------------------------------------------
    
    $scope.arraysEqual = function(arr1, arr2) {
    	
    // tarkistaa onko taulukoissa samat arvot (eli ovatko taulukot identtiset)
    	
//----------------------------------------------------------------------------------------
    	
        if(arr1.length !== arr2.length)
            return false;
        for(var i = arr1.length; i--;) {
            if(arr1[i] !== arr2[i])
                return false;
        }

        return true;
    }
    
    
    
    
    
    
    
    
    
  //----------------------------------------------------------------------------------------

    $scope.resetUI = function() {
    	
    // nollaa kälissä sillat, paino- ja korkeusrajat sekä auton tiedot, ajomatkan ja -ajan.
    
//----------------------------------------------------------------------------------------
    	
    	$scope.route_distance = 0;
        $scope.route_duration = 0;
        $scope.route_weight_restriction = max_weight_on_road;
        $scope.route_height_restriction = max_height_on_road;
        $scope.car_id = '--';
		$scope.car_weight = '--';
		$scope.car_height = '--';
		$scope.directionsDisplay.setMap(null);
		$scope.timetable = "";
		
        for(var i = 0; i < $scope.bridges.length; i++) {
    		if($scope.bridges[i].type == "bridge")
    			$scope.bridges[i].setIcon("kuvat/bridge.png");	// asetetaan normaali siltaikoni näkyviin
    	}	
    }
    
    
    
    
    

    
    
//----------------------------------------------------------------------------------------
    
    $scope.checkRouteRestrictions = function (route) {
    	
    // katsoo reitin kaikki autokohtaiset rajoitukset ja päivittää ne karttaan ja paneeliin
    
//----------------------------------------------------------------------------------------

		var checkrouteresults = $scope.checkBridgesOnRoute(route.route.routes[0]);
		$scope.setRouteRestrictions(checkrouteresults);
		$scope.setBridgeIcons(checkrouteresults);
    
    
    }
    
    
    
    
    
    
    
    
    
//----------------------------------------------------------------------------------------
    
    
    $scope.drawArrowsOnRoute = function(route) {
    	
    // piirtää nuolia reittiviivalle niin että saa selvää kumpaan suuntaan reitti menee;
    // poistaa nuolet jos kartta on zoomattu ulos jonkun rajan ulkopuolelle (ZOOM_LIMIT);
    // (zoom-arvo kasvaa zoomatessa sisäänpäin)
    	
    // route: delivery_routes -taulukon solmu, joka vastaa valittuna olevaa reittiä
        
//----------------------------------------------------------------------------------------
    	
    	var ZOOM_LIMIT = 13;	// jos zoom-taso on vähintään tämä, piirretään suuntanuolia reittiviivalle
    	route = route.route.routes[0];
    	
    	// reitti on vaihtunut, tehdään uudet suuntanuolet uudelle reitille
    	if($scope.arrows_made_for_route !== route) {
    		//alert("luodaan");
    		
    		// luodaan nuoli
    		var arrowsymbol = {
        			path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
        		    strokeColor: '#005fbf',
        		    fillColor: '#005fbf',
        		    fillOpacity: 0.5,
        		    strokeOpacity: 0.0
        		};
        	
        	// luodaan viiva reittiviivan päälle jolle nuolet ripotellaan	
    		
    		// tee yksi polyline per reitin pätkä jonka päälle halutaan tasan yksi nuoli
    		// laita kukin polyline taulukkoon
    		// aseta polylinet näkyviin tai pois käymällä läpi taulukkoa ja asettamalla setMap/setVisible
    		
    		$scope.routeArrowPolylineArray = [];
    		
    		var path = [];
        	for(var i = 0; i < route.legs.length; i++) {
        		var leg = route.legs[i];
        		for(var j = 0; j < leg.steps.length; j++) {
        			path = path.concat(leg.steps[j].path);
        			
                	arrows_polyline = new google.maps.Polyline({ // globaali muuttuja, pakon edessä
        				path: path,
        				strokeOpacity: 0.0, // tämä viritys yrittää piirtää viivaa reittiviivan päälle, estetään
        				fillOpacity: 0.0,
        				visible: true,
        				map: $scope.map,
        				icons: [{
        					icon: arrowsymbol,
        					offset: '30%'
        				}],
        			});
                	
                	$scope.routeArrowPolylineArray.push(arrows_polyline);
                	path = [];
        		}
        	}
        	//alert("Pathissa on "+path.length+" pistettä");
        	$scope.arrows_made_for_route = route;	// "nämä nuolet on tehty tätä reittiä varten"
        }
    	
    	// onko nuolet jo piirretty mutta ne on piilotettu ja ne pitää laittaa taas näkyviin?
    	if($scope.map.getZoom() >= ZOOM_LIMIT && arrows_polyline.getVisible() === false) {
    		for(var i = 0; i < $scope.routeArrowPolylineArray.length; i++) {
    			$scope.routeArrowPolylineArray[i].setVisible(true);
    		}
    	}
    	
    	// onko zoomattu niin paljon ulos että nuolet pitää piilottaa?
    	else if($scope.map.getZoom() < ZOOM_LIMIT) {
    		for(var i = 0; i < $scope.routeArrowPolylineArray.length; i++) {
        		$scope.routeArrowPolylineArray[i].setVisible(false);
    		}
    	}
    }
    
    
    
    
    
    
    
    
//----------------------------------------------------------------------------------------
    
    
    $scope.hideArrows = function() {
    	
    // poistaa nuolet reittiviivasta
        
//----------------------------------------------------------------------------------------
    
    
    	if($scope.routeArrowPolylineArray === undefined || $scope.routeArrowPolylineArray === null)
    		return;
    	
    	for(var i = 0; i < $scope.routeArrowPolylineArray.length; i++) {
    		$scope.routeArrowPolylineArray[i].setVisible(false);
		}
    	
    	$scope.routeArrowPolylineArray = [];
    }
    	
    	
    	
    
    	
    	
    
    
//----------------------------------------------------------------------------------------

    $scope.checkBridgesOnRoute = function(route) {
    	
    // käy läpi kaikki sillat ja tarkistaa onko tällä reitillä silta- tmv. esteitä tälle ajoneuvolle;
    // palauttaa taulukon, sarakkeissa on reitin legien siltarajoitukset;
    // taulukon jokaisen alkion sisältö on [ ongelmasiltaindeksit[], reitin_painorajoitus, reitin_korkeusrajoitus ]
    // route: tarkistettava reitti
    
//----------------------------------------------------------------------------------------
    
        if(route === null || route === undefined) {
        	console.log("checkBridgesOnRoute(): reittiä ei ole");
        	return [];
        }
        
    	var legs = route.legs;
    	var restrictions_on_route = [];
    	
    	for(var i = 0; i < legs.length; i++) {
    		restrictions_on_route.push($scope.checkBridgesOnLeg(legs[i]));
    	}
 
    	return restrictions_on_route;
    	
    }
    
    
    
    
    
    
    
    
//----------------------------------------------------------------------------------------

    $scope.checkBridgesOnLeg = function(leg) {
    	
    // käy läpi kaikki sillat ja tarkistaa onko tällä legillä silta- tmv. esteitä tälle ajoneuvolle;
    // palauttaa [ roadblock_indices[], leg_weight_restriction, leg_height_restriction ]
//----------------------------------------------------------------------------------------
    	
    	
    	var steps = leg.steps;

    	// tee Polyline-objekti
        var polyline = new google.maps.Polyline({
            paths: []
        });
        
        // laita stepit polylineen
        
        var path_array = [];
        
        for(var i = 0; i < steps.length; i++) {
        	path_array = path_array.concat(steps[i].path);
        }

        polyline.setPath(path_array);
        
        // katso sillat tämän polylinen varrelta
        
        var bridgeresult = $scope.checkBridgesOnPolyline(polyline);
        return bridgeresult;
        
    }
    
    
    
    
    
    
    
    
    
//----------------------------------------------------------------------------------------

    $scope.checkBridgesOnPolyline = function(polyline) {
    	
    // käy läpi kaikki sillat ja tarkistaa onko tämän polylinen varrella silta- tmv. esteitä 
    // tälle ajoneuvolle
    	
//----------------------------------------------------------------------------------------

    	var roadblock_indices = [];	// ongelmasiltojen indeksit
    	    	
    	if(polyline === undefined) {
    		console.log("undefined polyline in checkBridgesOnPolyline()");
    		return undefined;
    	}
            	
        // aseta reitin lähtörajoituksiksi ajoneuvon suurimmat Suomessa sallitut arvot, näistä tullaan 
        // siltakohtaisesti alaspäin
        
        var leg_weight_restriction = max_weight_on_road;
        var leg_height_restriction = max_height_on_road;
        
        // käy kaikki tiedossa olevat sillat läpi
        
        for(var i = 0; i < $scope.bridges.length; i++) {
            if($scope.bridges[i].type == "marker")  // seassa on testimarkkeri, ei kosketa siihen
                continue;

           // if($scope.bridges[i].type == "bridge")
           //     $scope.bridges[i].setIcon("/int/kuvat/bridge.png");	// asetetaan normaali siltaikoni näkyviin

            this_bridge_is_problem = false;

            // katso osuuko sillan koordinaatit reitille annetulla tarkkuudella

            if(google.maps.geometry.poly.isLocationOnEdge($scope.bridges[i].position, polyline, 8*(10e-6))) {

                // tarkistetaan reitille osuvien siltojen paino- ja korkeusrajoitukset (raja = 0 = ei rajoitusta)

                // onko tällä sillalla painoraja? Jos on ja se on alempi kuin aimmilla silloilla, päivitetään tietoihin;
                if($scope.bridges[i].weight_limit > 0 && $scope.bridges[i].weight_limit < leg_weight_restriction) {
                    leg_weight_restriction = $scope.bridges[i].weight_limit;
                }

                // onko tällä sillalla korkeusraja? Jos on ja se on alempi kuin aimmilla silloilla, päivitetään tietoihin;
                if($scope.bridges[i].height_limit > 0 && $scope.bridges[i].height_limit < leg_height_restriction) {
                    leg_height_restriction = $scope.bridges[i].height_limit;
                }

                // onko tällä sillalla tätä ajoneuvoa koskeva painorajoitus?
                if($scope.bridges[i].weight_limit > 0 && $scope.bridges[i].weight_limit < $scope.getCar($scope.selected_route.car_id).weight) {
                    this_bridge_is_problem = true;
                }

                // onko tällä sillalla tätä ajoneuvoa koskeva korkeusrajoitus?

                if($scope.bridges[i].height_limit > 0 && $scope.bridges[i].height_limit < $scope.getCar($scope.selected_route.car_id).height) {
                    this_bridge_is_problem = true;
                }

                // ota ongelmasillan indeksi talteen
                
                if(this_bridge_is_problem === true) {
                    //$scope.bridges[i].setIcon("/int/kuvat/roadblock.png");
                    roadblock_indices.push(i);
                }
            }
        }
        
        return [roadblock_indices, leg_weight_restriction, leg_height_restriction];
    }

    
    
    
    
 
    
//----------------------------------------------------------------------------------------

    $scope.setRouteRestrictions = function(restrictions_on_route) {
    	
    // asettaa käliin reitin paino- ja korkeusrajat
    	
//----------------------------------------------------------------------------------------
	
    	var weight_restriction;
    	var height_restriction;
    	
    	for(var j = 0;  j < restrictions_on_route.length; j++) {
     		
    		// samalla asetetaan käliin reitin paino- ja korkeusrajat, ei tosin näy jos tämä coderun ei alkanut $scopesta
    		
    		weight_restriction = Math.min(weight_restriction, restrictions_on_route[j][1]);
    		height_restriction = Math.min(height_restriction, restrictions_on_route[j][2]);
    	}
    	
    	$scope.route_weight_restriction = weight_restriction;
    	$scope.route_height_restriction = height_restriction;
    	
    }
    	
    	
    	
    	
    
    	
 
    
//----------------------------------------------------------------------------------------
    
    $scope.setBridgeIcons = function(restrictions_on_route) {
    	
    // asettaa siltojen tmv. kuvakkeet kartalle sen mukaan onko silta este vai ei
    // index_array on alussa nousevassa järjestyksessä
    // restrictions_on_legs on checkBridgesOnRoute():n palauttama taulukko
        	
//----------------------------------------------------------------------------------------
    	    	
    	var all_problem_bridges_array = [];	// ongelmasiltojen indeksien taulukko
    	
    	var weight_restriction = max_weight_on_road; // suurin sallittu paino Suomen teillä
    	var height_restriction = max_height_on_road; // suurin sallittu korkeus
    	
    	// aluksi yhdistetään ongelmasiltojen legikohtaiset taulukot yhdeksi taulukoksi;
    	
    	for(var j = 0;  j < restrictions_on_route.length; j++) {
    		all_problem_bridges_array = all_problem_bridges_array.concat(restrictions_on_route[j][0]);	// siltaindeksitaulukko on taulukon eka alkio
    		
    		// samalla asetetaan käliin reitin paino- ja korkeusrajat, ei tosin näy jos tämä coderun ei alkanut $scopesta
    		
    		weight_restriction = Math.min(weight_restriction, restrictions_on_route[j][1]);
    		height_restriction = Math.min(height_restriction, restrictions_on_route[j][2]);
    	}
    
    	$scope.route_weight_restriction = weight_restriction;
    	$scope.route_height_restriction = height_restriction;
    	
    	console.log("Siltatsekissä löytyi "+all_problem_bridges_array.length+" ongelmasiltaa");
    	console.log("Reitin painoraja on "+weight_restriction+" kg ja korkeusraja "+height_restriction+" m");
    	
    	var problem_bridges_index = 0;	// ongelmasiltataulukon indeksi
    	
    	// käy koko siltalista läpi ja aseta ikonit sen mukaan onko silta ongelma vai ei
    	
    	for(var i = 0; i < $scope.bridges.length; i++) {
    		
    		if(all_problem_bridges_array[problem_bridges_index] == i) {
    			
    			// aseta laita estoikoni jos sillan indeksi on ongelmasiltojen taulukossa
    			$scope.bridges[i].setIcon("kuvat/roadblock.png");
    			problem_bridges_index++;
    		}
    		else {
    			// muutoin laita normaali ikoni
    			if($scope.bridges[i].type == "bridge")
                    $scope.bridges[i].setIcon("kuvat/bridge.png");	// asetetaan normaali siltaikoni näkyviin
    		}	
    	}    	
    }
    
    
    
    

    
    
    
    
//----------------------------------------------------------------------------------------
    
    $scope.scrollTo = function (id) {
    	
    // skrollaa ikkunan annettuun elementtiin
    // id: elementin id johon skrollataan
    	
//----------------------------------------------------------------------------------------
    	
        var old = $location.hash();
        $location.hash(id);
        $anchorScroll();
        $location.hash(old);
      }
    

    
    
    
    
    
}]); // routingCtrl

