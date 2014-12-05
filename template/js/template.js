$(document).keyup(function(event) {
	if((_s.name == "multi_trial" || _s.name == "practice1" || _s.name == "practice2") 
			&& (event.keyCode == 80 || event.keyCode == 81)) _s.check(event.keyCode);
});

$(window).blur(function() {
    exp.timesleft++;
});

function make_slides(f) {
  var   slides = {};

  slides.i0 = slide({
     name : "i0",
     start: function() {
      exp.startT = Date.now();
     }
  });

  slides.instructions = slide({
    name : "instructions",
    button : function() {
      exp.go(); //use exp.go() if and only if there is no "present" data.
    }
  });
  
  var tutchoice = 0;
  slides.practice1 = slide({
	  name : "practice1",
	  present : ["For each trial, you will see these two containers, labeled 'Q' and 'P'.",
	             "One of these containers holds a marble. Your job is to guess which one, by typing the corresponding key on your keyboard. If you think the marble is in container Q, type 'q'. If you think it's in P, type 'p'.</p><p>If you are correct, you get a point.",
	             "Let's try it now. Hit 'q' or 'p' to guess which container holds the marble."],
	  step : 0,
	  
	  present_handle : function(stim) {
	      this.stim = stim;
	      $(".prompt").html(stim);
	  },
	  
	  check : function(val) {
		  tutchoice = 81-val;
		  _stream.apply(_s);
	  },
	  
	  button : function() {
		  if(this.step == 0) {
			  $('.Qmarble').show();
			  $('.Pmarble').show();
		  } else {
			  $('.Qmarble').hide();
			  $('.Pmarble').hide();
			  $('.button').hide();
		  }
		  this.step++;
		  _stream.apply(_s);
	  }
  });
  
  slides.practice2 = slide({
	  name : "practice2",
	  present : ["Correct!",
	             "Now, let's pretend that we know the marble is in container P. Which container holds the marble?",
	             "Correct!",
	             "During the actual trials, you will have a 3-second time limit to respond.</p><p>The next trial will proceed shortly after the ending of the previous one.",
	             "Your answer and score on any trial will have no effect on the correct answers to subsequent trials.</p><p>The correct answers have already been decided.",
	             "This completes the tutorial. Hit the button when you are ready to proceed. The trials will start immediately and cannot be paused.</p><p>Good luck!"],
	  step : 0,
	  
	  present_handle : function(stim) {
		  this.stim = stim;
		  if(this.step == 0) {
			  if(tutchoice == 0) {
				  $('.Qmarble').show();
				  $('.Pmarble').hide();
			  } else {
				  $('.Pmarble').show();
				  $('.Qmarble').hide();
			  }
			  window.setTimeout(function(){_s.proceed();},1500);
		  }
	      $(".prompt").html(stim);
	      if(this.step == 2) $('.button').show();
	  },
	  
	  proceed : function() {
		  this.step++;
		  $('.Pmarble').hide();
		  $('.Qmarble').hide();
		  _stream.apply(_s);
	  },
	  
	  check : function(val) {
		  if(81-val == 0) $('.prompt').html("That is incorrect. The marble is in container P. Which container holds the marble?");
		  else {
			  $('.Pmarble').show();
			  _stream.apply(_s);
			  window.setTimeout(function(){_s.proceed();},1500);
		  }
	  },
	  
	  button : function() {
		  _stream.apply(_s);
	  }
  });
  
  var ntrials = 10;
  var bias = .8; //Level of bias toward one side or the other, expressed as a decimal > 0.5
  slides.multi_trial = slide({
	  name: "multi_trial",
	  count: ntrials,
	  disp: 0, //Whether or not the slide is showing a message, as opposed to taking responses
	  timelimit: 5000,
	  present: _.range(ntrials+1), //Dummy values for progress bar calculations
	  startTime: 0,
	  
	  start : function() {
		  $(".err").hide();
		  var sample = [];
		  var nbiased = Math.floor(bias*ntrials);
		  for(var i = 0; i < nbiased; i++) 
			  sample.push(exp.condition == "Leftbias"?{"answer": 0}:{"answer": 1});
		  for(var i = 0; i < ntrials-nbiased; i++) 
			  sample.push(exp.condition == "Leftbias"?{"answer": 1}:{"answer": 0});
		  this.present = _.shuffle(sample);
		  this.present.push("dummy");
	      $(".prompt").html("Which container holds the marble? Hit 'q' or 'p' to indicate your choice.");
	  },

	  present_handle : function(stim) {
	      this.stim = stim;
	      $(".status").html("Your score is "+exp.score+"/"+ntrials);
	      $(".result").html(" ");
	      $(".Pmarble").hide();
	      $(".Qmarble").hide();
	      if(!this.count) {
	    	  this.disp = 1;
	    	  $(".procbutton").show();
		      $(".prompt").html("You're all done with this portion of the experiment. Hit the button to proceed.");
	      }
	      var current = this.count;
	      this.startTime = Date.now();
	      window.setTimeout(function(){_s.timeout(current);},this.timelimit);
	  },


	  check : function(val) {
		  var rTime = Date.now()-this.startTime;
		  var choice = 81-val;
		  if(this.count == ntrials) this.timelimit = 3000;
		  if(!this.disp) {
			  this.disp = 1;
			  if(choice == this.stim.answer) {
				  this.log_responses(choice,1,rTime);
				  $(".result").html("Correct");
				  exp.score++;
			  } else {
				  this.log_responses(choice,0,rTime);
				  $(".result").html("Incorrect");
			  }
			  this.showmarble();
			  window.setTimeout(this.proceed,1500);
		  }
	  },

	  
	  timeout : function(current) {
		  if(this.count && !this.disp && current==this.count) {
			  this.disp = 1;
			  if(this.count == ntrials) this.timelimit = 3000;
			  $(".result").html("You did not answer within the time limit.");
			  this.log_responses(-1,-1,3000);
			  this.showmarble();
			  window.setTimeout(this.proceed,1500);
		  }
	  },
	  
	  showmarble : function() {
			  if(this.stim.answer==0) $(".Qmarble").show();
			  else $(".Pmarble").show();
	  },
	  
	  proceed : function() {
		  _s.count--;
		  _s.disp = 0;
		  _stream.apply(_s);
	  },

	  button : function() {
	      this.log_responses(exp.score, "Final");
	      exp.go();
	  },
	  
	  log_responses : function(answer, result, rTime) {
	      exp.data_trials.push({
	        "trial_type" : "multi_trial",
	        "response" : answer,
	        "result" : result,
	        "time" : rTime
	      });
	  }
  });

  slides.single_trial = slide({
    name: "single_trial",
    start: function() {
      $(".err").hide();
      $(".display_condition").html("You are in " + exp.condition + ".");
    },
    button : function() {
      response = $("#text_response").val();
      if (response.length == 0) {
        $(".err").show();
      } else {
        exp.data_trials.push({
          "trial_type" : "single_trial",
          "response" : response
        });
        exp.go(); //make sure this is at the *end*, after you log your data
      }
    },
  });

  slides.one_slider = slide({
    name : "one_slider",

    /* trial information for this block
     (the variable 'stim' will change between each of these values,
      and for each of these, present_handle will be run.) */
    present : [
      {subject: "dog", object: "ball"},
      {subject: "cat", object: "windowsill"},
      {subject: "bird", object: "shiny object"},
    ],

    //this gets run only at the beginning of the block
    present_handle : function(stim) {
      $(".err").hide();

      this.stim = stim; //I like to store this information in the slide so I can record it later.


      $(".prompt").html(stim.subject + "s like " + stim.object + "s.");
      this.init_sliders();
      exp.sliderPost = null; //erase current slider value
    },

    button : function() {
      if (exp.sliderPost == null) {
        $(".err").show();
      } else {
        this.log_responses();

        /* use _stream.apply(this); if and only if there is
        "present" data. (and only *after* responses are logged) */
        _stream.apply(this);
      }
    },

    init_sliders : function() {
      utils.make_slider("#single_slider", function(event, ui) {
        exp.sliderPost = ui.value;
      });
    },

    log_responses : function() {
      exp.data_trials.push({
        "trial_type" : "one_slider",
        "response" : exp.sliderPost
      });
    }
  });

  slides.multi_slider = slide({
    name : "multi_slider",
    present : _.shuffle([
      {"critter":"Wugs", "property":"fur"},
      {"critter":"Blicks", "property":"fur"}
    ]),
    present_handle : function(stim) {
      $(".err").hide();
      this.stim = stim; //FRED: allows you to access stim in helpers

      this.sentence_types = _.shuffle(["generic", "negation", "always", "sometimes", "usually"]);
      var sentences = {
        "generic": stim.critter + " have " + stim.property + ".",
        "negation": stim.critter + " do not have " + stim.property + ".",
        "always": stim.critter + " always have " + stim.property + ".",
        "sometimes": stim.critter + " sometimes have " + stim.property + ".",
        "usually": stim.critter + " usually have " + stim.property + "."
      };

      this.n_sliders = this.sentence_types.length;
      $(".slider_row").remove();
      for (var i=0; i<this.n_sliders; i++) {
        var sentence_type = this.sentence_types[i];
        var sentence = sentences[sentence_type];
        $("#multi_slider_table").append('<tr class="slider_row"><td class="slider_target" id="sentence' + i + '">' + sentence + '</td><td colspan="2"><div id="slider' + i + '" class="slider">-------[ ]--------</div></td></tr>');
        utils.match_row_height("#multi_slider_table", ".slider_target");
      }

      this.init_sliders(this.sentence_types);
      exp.sliderPost = [];
    },

    button : function() {
      if (exp.sliderPost.length < this.n_sliders) {
        $(".err").show();
      } else {
        this.log_responses();
        _stream.apply(this); //use _stream.apply(this); if and only if there is "present" data.
      }
    },

    init_sliders : function(sentence_types) {
      for (var i=0; i<sentence_types.length; i++) {
        var sentence_type = sentence_types[i];
        utils.make_slider("#slider" + i, this.make_slider_callback(i));
      }
    },
    make_slider_callback : function(i) {
      return function(event, ui) {
        exp.sliderPost[i] = ui.value;
      };
    },
    log_responses : function() {
      for (var i=0; i<this.sentence_types.length; i++) {
        var sentence_type = this.sentence_types[i];
        exp.data_trials.push({
          "trial_type" : "multi_slider",
          "sentence_type" : sentence_type,
          "response" : exp.sliderPost[i]
        });
      }
    },
  });

  slides.subj_info =  slide({
    name : "subj_info",
    submit : function(e){
      //if (e.preventDefault) e.preventDefault(); // I don't know what this means.
      exp.subj_data = {
        language : $("#language").val(),
        enjoyment : $("#enjoyment").val(),
        asses : $('input[name="assess"]:checked').val(),
        age : $("#age").val(),
        gender : $("#gender").val(),
        education : $("#education").val(),
        comments : $("#comments").val(),
      };
      exp.go(); //use exp.go() if and only if there is no "present" data.
    }
  });

  slides.thanks = slide({
    name : "thanks",
    start : function() {
      exp.data= {
          "trials" : exp.data_trials,
          "catch_trials" : exp.catch_trials,
          "system" : exp.system,
          "condition" : exp.condition,
          "subject_information" : exp.subj_data,
          "time_in_minutes" : (Date.now() - exp.startT)/60000,
          "times_left" : exp.timesleft
      };
      setTimeout(function() {turk.submit(exp.data);}, 1000);
    }
  });

  return slides;
}

/// init ///
function init() {
  exp.catch_trials = [];
  exp.condition = _.sample(["Leftbias", "Rightbias"]); //can randomize between subject conditions here
  exp.score = 0;
  exp.timesleft = 0;
  exp.system = {
      Browser : BrowserDetect.browser,
      OS : BrowserDetect.OS,
      screenH: screen.height,
      screenUH: exp.height,
      screenW: screen.width,
      screenUW: exp.width
    };
  //blocks of the experiment:
  exp.structure=["i0", "instructions", "practice1", "practice2", "multi_trial", "single_trial", 'subj_info', 'thanks']; //"one_slider", "multi_slider", 'subj_info', 'thanks'];

  //Define section bounds for the secondary progress bar
  exp.secEnd=[-1,3,4,exp.structure.length-1]; //The indices in exp.structure of the end slide of each section

  exp.data_trials = [];
  //make corresponding slides:
  exp.slides = make_slides(exp);

  exp.nQs = utils.get_length(0,exp.structure.length-1); //this does not work if there are stacks of stims (but does work for an experiment with this structure)
                    //relies on structure and slides being defined
  					//doesn't count last slide
  exp.secnQs = [];
  for(var i = 1; i < exp.secEnd.length; i++) exp.secnQs.push(utils.get_length(exp.secEnd[i-1]+1,exp.secEnd[i])); // Populates secnQs array with length of each section
  $('.slide').hide(); //hide everything
  
  //make sure turkers have accepted HIT (or you're not in mturk)
  $("#start_button").click(function() {
    if (turk.previewMode) {
      $("#mustaccept").show();
    } else {
      $("#start_button").click(function() {$("#mustaccept").show();});
      exp.go();
    }
  });

  exp.go(); //show first slide
}