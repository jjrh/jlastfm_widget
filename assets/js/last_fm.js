
var rss_urls = {
    "last_10_songs": "http://ws.audioscrobbler.com/1.0/user/slicenice/recenttracks.rss",
    "loved_tracks": "http://ws.audioscrobbler.com/2.0/user/slicenice/lovedtracks.rss",
    
}
var xml_urls = {

    "artists": {
	"weeklyartistchart": "http://ws.audioscrobbler.com/2.0/user/slicenice/weeklyartistchart.xml",
	"top_artists": "http://ws.audioscrobbler.com/2.0/user/slicenice/topartists.xml",
	"top_artists_3month": "http://ws.audioscrobbler.com/2.0/user/slicenice/topartists.xml?period=3month",
	"top_artists_6month": "http://ws.audioscrobbler.com/2.0/user/slicenice/topartists.xml?period=6month",
	"top_artists_12month": "http://ws.audioscrobbler.com/2.0/user/slicenice/topartists.xml?period=12month",
    },
    "tracks": {
	"weeklytrackchart": "http://ws.audioscrobbler.com/2.0/user/slicenice/weeklytrackchart.xml",
	"top_tracks": "http://ws.audioscrobbler.com/2.0/user/slicenice/toptracks.xml",
	"top_tracks_3month": "http://ws.audioscrobbler.com/2.0/user/slicenice/toptracks.xml?period=3month",
	"top_tracks_6month": "http://ws.audioscrobbler.com/2.0/user/slicenice/toptracks.xml?period=6month",
	"top_tracks_12month": "http://ws.audioscrobbler.com/2.0/user/slicenice/toptracks.xml?period=12month",
    }
}

var stat_data = {"artists":{},"tracks":{},"weeklycharts":{} }    



/* do RSS stuff here... */
function get_last_10(){
    var RSS_URL = rss_urls["last_10_songs"]
    $.ajax({
	url: document.location.protocol + '//ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=10&callback=?&q=' + encodeURIComponent(RSS_URL),
	dataType: 'json',
	success: function(data) {
	    build_dom_rss(data.responseData.feed); //dump_data(data.responseData.feed,selector);
	}
    });
}
//"Ryan Paris – Dolce Vita (Part I - Vocal) (Extended Disco Mix)"
function build_dom_rss(data){
    $("#last_10_songs").append("<ul>");
    entries = data.entries;
    for(var i=0; i< entries.length; i++){
	/*
	  entries[x] = {
	      author: "",
	      categories: Array[0],
	      content: "http://www.last.fm/music/Accidental+Heroes",
	      contentSnippet: "http://www.last.fm/music/Accidental+Heroes",
	      link: "http://www.last.fm/user/slicenice#1385069306",
	      publishedDate: "Thu, 21 Nov 2013 13:28:26 -0800",
	      title: "Accidental Heroes – Precinct 13"
	  }
	  Taking this example we can see content does point to the artists page. Still, content seems questionable as to 
	  what it implies. Current method of hacking up the song title seems appropiate.

	  *** one note, the character between the artist and title, looks like a "-". It is not. It's a unicode character: \u2013
	  see: http://www.ascii.cl/htmlcodes.htm
	  
	*/

	var str = entries[i].title;
	var artist = {"title":str.split("\u2013")[0].trim(),
		      "url":"www.last.fm/music/"+str.split("\u2013")[0].trim().replace(" ","+")
		     }
	var track = {"title": str.split("\u2013")[1].trim(),
		     "url": artist.url + "/_/" + str.split("\u2013")[1].trim().replace(" ","+")
		    }

	
	
	var plays = "";
	var rank = "";

	/* trying to get /when/ it was played.
	   * we run into some issues with spacing
	 */
	var publish_date = new Date(entries[i].publishedDate);
	var diff = new Date() - publish_date;

	diff = ((diff/1000)/60)/60;
	
	diff = Math.round(diff);
	if(diff >= 24){
	    format_string = publish_date.toString();
	    format_string = format_string.split(" ");
	    format_string = format_string[1]+" "+format_string[2]+","+format_string[4].split(":")[0]+":"+format_string[4].split(":")[1];
	    console.log(format_string);
	    plays = format_string
	}
	else{
	    console.log(diff + " hours ago");
	    plays = diff + "h";
	}
	

	
	var html_entry = make_entry_template(artist,track,rank,plays);
	$("#last_10_songs").append(html_entry);
    }
    $("#last_10_songs").append("</ul>");
    
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function xml2json(url,type,period){
    var def = $.Deferred();
    $.get(url, function(xml){
	stat_data[type][period] = $.xml2json(xml);
	def.resolve();
    });
    return def.promise();
}
			    

var xml_all = function(){
    /* I don't understand why I can't pass in a array of promises */
    $.when(xml2json(xml_urls["tracks"]["weeklytrackchart"],"weeklycharts","weeklytrackchart"),
	   xml2json(xml_urls["tracks"]["top_tracks"],"tracks","top_tracks"), 
	   xml2json(xml_urls["tracks"]["top_tracks_3month"],"tracks","top_tracks_3month" ),
	   xml2json(xml_urls["tracks"]["top_tracks_6month"],"tracks","top_tracks_6month"),
	   xml2json(xml_urls["tracks"]["top_tracks_12month"],"tracks","top_tracks_12month"),
	   xml2json(xml_urls["artists"]["weeklyartistchart"],"weeklycharts","weeklyartistchart"),
	   xml2json(xml_urls["artists"]["top_artists"],"artists","top_artists"), 
	   xml2json(xml_urls["artists"]["top_artists_3month"],"artists","top_artists_3month"),
	   xml2json(xml_urls["artists"]["top_artists_6month"],"artists","top_artists_6month"),
	   xml2json(xml_urls["artists"]["top_artists_12month"],"artists","top_artists_12month")
	  ).done(build_dom_xml);
}

function build_dom_xml(stat_data_selector,id_selector){
    /* generate tracks html stuff .... */
    build_tracks();
    build_artists();
    build_charts();

}

/* data should look like:

*/

function make_entry_template(artist,track,rank,plays){
    html_dump = "<li>";
    html_dump = html_dump+"<span>";
    html_dump = html_dump+"<b>"+rank+". </b>"
    html_dump = html_dump+"<a href='http://"+artist.url+"'>"+artist.title+"</a>";
    if(track.title != ""){
	html_dump = html_dump+" - ";
	html_dump = html_dump+"<a href='http://"+track.url+"'>"+track.title+"</a>";
    }
    // html_dump = html_dump+"<a href='"+track.url+"'>"+track.title+"</a>";

    html_dump = html_dump+"</span>";

    
    html_dump = html_dump+"<span class='plays pull-right' value='"+plays+"'>"+plays+"</span>";
    html_dump = html_dump+"</li>";

    return html_dump
}

function build_tracks(){    
    $.each(stat_data["tracks"], function(k,v){
	var track_type = v["toptracks"]["@attributes"]["type"];
	var tracks = v["toptracks"]["track"];

	$("#songs_"+track_type).append("<ul>");
	for(var i = 0; i< tracks.length; i++){
	    var artist = {"title":tracks[i].artist.name.value,
			  "url": tracks[i].artist.url.value
			  }


	    var track = {"title": tracks[i].name.value,
			 "url":tracks[i].url.value
			}

	    var rank = tracks[i]['@attributes'].rank;
	    var plays = tracks[i].playcount.value;

	    var html_entry = make_entry_template(artist,track,rank,plays);
	    $("#songs_"+track_type).append(html_entry)
	}
	$("#songs_"+track_type).append("</ul>");
    });
}

function build_artists(){
    /* generate artist html stuff .... */
    $.each(stat_data["artists"], function(k,v){
	var artist_type = v["topartists"]["@attributes"]["type"];
	var artists = v["topartists"]["artist"];
	
	$("#artists_"+artist_type).append("<ul>");
	
	for(var i = 0; i< artists.length; i++){
	    var artist = {"title":artists[i].name.value,
			  "url":artists[i].url.value
			 }
	    var track = {"title":"",
			 "url":""
			}
	    var plays = artists[i].playcount.value;
	    var rank = artists[i]['@attributes'].rank;

	    var html_entry = make_entry_template(artist,track,rank,plays);
	    $("#artists_"+artist_type).append(html_entry)
	}
	$("#artists_"+artist_type).append("</ul>");
    });


    
}


function build_charts(){
    $.each(stat_data["weeklycharts"]["weeklytrackchart"], function(k,v){
	// var track_type = v["toptracks"]["@attributes"]["type"];
	var track_type = "week";
	var tracks = v["track"];
	$("#songs_"+track_type).append("<ul>");
	for(var i = 0; i< tracks.length && i<10; i++){
	    var artist = {"title": tracks[i].artist.value,
			  "url": tracks[i].url.value.split("_/")[0] // stupid hack, they don't give me the url directly.
			 }
	    var track = {"title":tracks[i].name.value,
			 "url":tracks[i].url.value
			 }
	    var plays = tracks[i].playcount.value;
	    var rank = tracks[i]['@attributes'].rank;

	    var html_entry = make_entry_template(artist,track,rank,plays);
	    $("#songs_"+track_type).append(html_entry)
	}
	$("#songs_"+track_type).append("</ul>");
    }); 

    /* generate weekly artists charts .... */
    $.each(stat_data["weeklycharts"]["weeklyartistchart"], function(k,v){
	var artist_type = "week" //v["weeklyartistchart"]["@attributes"]["type"];
	var artists = v["artist"];
	
	$("#artists_"+artist_type).append("<ul>");
	for(var i = 0; i< artists.length && i<10; i++){
	    var artist = {"title":artists[i].name.value,
			  "url": artists[i].url.value
			 }
	    var track = {"title":"",
			 "url":"",
			 }

	    var plays = artists[i].playcount.value;
	    var rank = artists[i]['@attributes'].rank

	    var html_entry = make_entry_template(artist,track,rank,plays);
	    $("#artists_"+artist_type).append(html_entry);
	}
	$("#artists_"+artist_type).append("</ul>");
    });
}

 

/*
<div class="col-md-4 small" id="lastfm">
	 <!-- last.fm -->
	 <h3>Last.fm</h3>
	 <ul class="nav nav-tabs">
	   <li class="active"><a href="#last_10_songs" data-toggle="tab">Last 10 songs</a></li>
	   <li><a href="#songs" data-toggle="tab">Songs</a></li>
	   <li><a href="#artists" data-toggle="tab">Artists</a></li>

	 </ul>

	 <div class="tab-content">
	   <div class="tab-pane active" id="last_10_songs">
	   </div>

	   <div class="tab-pane" id="songs">
	     <ul class="nav nav-tabs">
	       <li class="active"><a href="#songs_week" data-toggle="tab">week</a></li>
	       <li><a href="#songs_3month" data-toggle="tab">3 months</a></li>
	       <li><a href="#songs_6month" data-toggle="tab">6 months</a></li>
	       <li><a href="#songs_12month" data-toggle="tab">12 months</a></li>
	       <li><a href="#songs_overall" data-toggle="tab">Overall</a></li>
	     </ul>
	     <div class="tab-content">
	       <div class="tab-pane active" id="songs_week">week song</div>
	       <div class="tab-pane" id="songs_3month">3month</div>
	       <div class="tab-pane" id="songs_6month">6month</div>
	       <div class="tab-pane" id="songs_12month">12month</div>
	       <div class="tab-pane" id="songs_overall">overall</div>
	       </div>
	   </div>

	   <div class="tab-pane" id="artists">
	     <ul class="nav nav-tabs">
	       <li class="active"><a href="#artists_week" data-toggle="tab">week</a></li>
	       <li><a href="#artists_3month" data-toggle="tab">3 months</a></li>
	       <li><a href="#artists_6month" data-toggle="tab">6 months</a></li>
	       <li><a href="#artists_12month" data-toggle="tab">12 months</a></li>
	       <li><a href="#artists_overall" data-toggle="tab">Overall</a></li>
	     </ul>
	     <div class="tab-content">
	       <div class="tab-pane active" id="artists_week">week artist</div>
	       <div class="tab-pane" id="artists_3month">3month</div>
	       <div class="tab-pane" id="artists_6month">6month</div>
	       <div class="tab-pane" id="artists_12month">12month</div>
	       <div class="tab-pane" id="artists_overall">overall</div>
	       </div>
	   </div>
	 </div>
       </div> <!-- end last_fm container -->
     </div>
*/
