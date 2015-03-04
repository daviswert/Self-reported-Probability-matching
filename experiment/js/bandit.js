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
    start : function() {
      $("#num-trials").html(exp.ntrials);  
    },
    button: function (){
      exp.go(); 
    }
  });
  
  var tutchoice = 0;
  slides.practice1 = slide({
	  name : "practice1",
	  present : ["For each trial, you will see these two containers, labeled 'Q' and 'P'.",
	             "One of these containers holds a marble. Your job is to guess which one, by typing the corresponding key on your keyboard.</p><p>If you think the marble is in container Q, type 'q'. If you think it's in P, type 'p'.</p><p>If you are correct, you get a point.",
	             "Let's try it now. Hit 'q' or 'p' to guess which container holds the marble."],
	  step : 0,
	  
	  present_handle : function(stim) {
	      this.stim = stim;
	      $(".prompt").html(stim);
	  },
	  
	  check : function(val) {
		  if(this.step == 2) {
			  tutchoice = 81-val;
			  _stream.apply(_s);
		  }
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
	             "During the actual trials, you will have a "+(exp.timelimit/1000)+"-second time limit to respond.</p><p>Each trial will proceed shortly after the ending of the previous one.</p><p>There are "+exp.ntrials+" trials total.",
	             "Your performance on any trial will have no effect on where the marble will be on subsequent trials.</p><p>The marble's positions have been decided in advance.",
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
			  window.setTimeout(function(){_s.proceed();},exp.displimit);
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
		  if(this.step == 1) {
			  if(81-val == 0) $('.prompt').html("That is incorrect. The marble is in container P. Which container holds the marble?");
			  else {
				  $('.Pmarble').show();
				  _stream.apply(_s);
				  window.setTimeout(function(){_s.proceed();},exp.displimit);
			  }
		  }
	  },
	  
	  button : function() {
		  _stream.apply(_s);
	  }
  });
  
  slides.multi_trial = slide({
	  name: "multi_trial",
	  count: exp.ntrials,
	  current: 0,
	  disp: false, //Whether or not the slide is showing a message, as opposed to taking responses
	  timelimit: exp.timelimit+2000,
	  present: _.range(exp.ntrials+1), //Dummy values for progress bar calculations
	  startTime: 0,
	  
	  start : function() {
		  $(".err").hide();
		  var sample = [];
		  var nbiased = Math.floor(exp.bias*exp.ntrials);
		  for(var i = 0; i < nbiased; i++) 
			  sample.push(exp.condition == "L"?{"answer": 0}:{"answer": 1});
		  for(var i = 0; i < exp.ntrials-nbiased; i++) 
			  sample.push(exp.condition == "L"?{"answer": 1}:{"answer": 0});
		  this.present = _.shuffle(sample);
	      $(".prompt").html("Which container holds the marble? Hit 'q' or 'p' to indicate your choice.");
	  },

	  //Debugging code - probably safe to delete at this point
	  /*countAnswers : function() {
		  num0 = 0;
		  num1 = 0;
		  for(var i = 0; i < this.present.length; i++) {
			  if(this.present[i].answer == 0) num0++;
			  else num1++;
		  }
		  console.log("Zeroes: "+num0);
		  console.log("Ones: "+num1);
		  console.log("Total: "+(num0+num1));
	  },*/

	  present_handle : function(stim) {
	      this.stim = stim;
	      $(".status").html("Your score is "+exp.score);
	      $(".result").html(" ");
	      $(".Pmarble").hide();
	      $(".Qmarble").hide();
	      if(!this.count) {
	    	  this.disp = true;
	    	  $(".procbutton").show();
		      $(".prompt").html("This completes the guessing game. Hit the button to proceed.");
	      }
	      this.current = this.count; //Not superfluous - the check method needs this to be separate so that it can update with the stim
	      var current = this.count; //Not superfluous - the timeout method needs this to be separate so that it doesn't update with the stim
	      this.startTime = Date.now();
	      window.setTimeout(function(){_s.timeout(current);},this.timelimit);
	  },

	  check : function(val) {
		  if(this.count && this.current==this.count) {
			  var rTime = Date.now()-this.startTime;
			  var choice = 81-val;
			  var pick = choice==0 ? "L" : "R";
			  var matched = 0;
			  if(this.count == exp.ntrials) this.timelimit = exp.timelimit;
			  if(!this.disp) {
				  this.disp = true;
				  if(choice == (exp.condition=="R" ? 1 : 0)) matched = 1;
				  if(choice == this.stim.answer) {
					  this.log_responses(pick,1,matched,rTime);
					  $(".result").html("Correct");
					  exp.score++;
				  } else {
					  this.log_responses(pick,0,matched,rTime);
					  $(".result").html("Incorrect");
				  }
				  this.showmarble();
				  window.setTimeout(this.proceed,exp.displimit);
			  }
		  }
	  },
	  
	  timeout : function(current) {
		  if(this.count && !this.disp && current==this.count) {
			  this.disp = true;
			  if(this.count == exp.ntrials) this.timelimit = exp.timelimit;
			  $(".result").html("You did not answer within the time limit.");
			  this.log_responses("timeout",-1,0,this.timelimit);
			  this.showmarble();
			  window.setTimeout(this.proceed,exp.displimit);
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
	      exp.go();
	  },
	  
	  log_responses : function(answer, result, matched, rTime) {
	      exp.data_trials.push({
	        "trial_type" : "multi_trial",
	        "trial" : exp.ntrials + 1 - this.count,
	        "response" : answer,
	        "result" : result,
	        "matched" : matched,
	        "rt" : rTime,
	        "bias_%" : (exp.bias*100),
	        "bias_direction" : exp.condition,
	        "Lbias_%" : exp.leftbias
	      });
	  }
  });
  
  slides.post_instructions = slide({
	name : "post_instructions",
	button : function() {
	  exp.go(); //use exp.go() if and only if there is no "present" data.
	},
      
    timeout : function(current){return;}
  });

  slides.elicit_prevalence = slide({
    name: "elicit_prevalence",
    type : ["catch1","catch2","catch3","prevalence"],
    answer_type : [" boxes",
                   " times",
                   " trials",
                   " %"],
    answer_length_constraint : [2,2,3,3],
    question : ["How many boxes were present on-screen while you were playing the game?",
                "Before the actual game began, the tutorial asked you twice to guess which box held the marble. How many times did you get it right?",
                "How many trials did the game consist of?",
                "If you were to play the same game many more times, what percentage of times do you think the marble would be in the LEFT container?\n"],
    present : _.range(4), //acts as a forloop counter which is trackable by the progress bar
    
    //this gets run only at the beginning of the block
    present_handle : function(stim) {
      this.startTime = Date.now();
      this.stim = stim; // Since the other methods need this value
      $(".err").hide();
      $("#text_response").val('');
      length = this.answer_length_constraint[this.stim];
      this.maxval = Math.pow(10,length-1);
      $(".err").html("Please enter a number between 0-" + this.maxval);
      $("#text_response").prop('maxlength', length);
      $(".query").html(this.question[stim]);
      $("#unit").html(this.answer_type[stim]);
    },

    button : function() {
      response = $("#text_response").val();
      if (!(response<=this.maxval && response>=0 && response!='')) {
        $(".err").show();
      } else {
        this.rt = Date.now() - this.startTime;
        this.log_responses();
        _stream.apply(this);
      }
    },

    log_responses : function() {
      exp.data_trials.push({
        "trial_type" : "elicit_prevalence",
        "trial" : this.type[this.stim],
        "response" : $("#text_response").val(),
        "matched" : 0,
        "rt" : this.rt,
        "bias_%" : (exp.bias*100),
        "bias_direction" : exp.condition,
        "Lbias_%" : exp.leftbias
      });
    }
  });

  /*slides.single_trial = slide({
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
      and for each of these, present_handle will be run.) 
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
        "present" data. (and only *after* responses are logged) 
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
  });*/

  slides.subj_info =  slide({
    name : "subj_info",
    submit : function(e){
      //if (e.preventDefault) e.preventDefault(); // I don't know what this means.
      exp.subj_data = {
        language : $("#language").val(),
        enjoyment : $("#enjoyment").val(),
        assess : $('input[name="assess"]:checked').val(),
        age : $("#age").val(),
        gender : $("#gender").val(),
        education : $("#education").val(),
        strategy : $("#strategy").val(),
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
  exp.condition = _.sample(["L", "R"]); //can randomize between subject conditions here
  exp.bias = _.sample([0.6, 0.8]); //Level of bias toward one side or the other, expressed as a decimal > 0.5
  exp.leftbias = exp.condition=="L" ? exp.bias : Math.ceil((1-exp.bias)*10)/10; //A rounding function to take care of floating-point subtraction errors
  exp.ntrials = 50;
  exp.timelimit = 2000;
  exp.displimit = 1000;
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
  exp.structure=["i0", "instructions", "practice1", "practice2", "multi_trial", "post_instructions", "elicit_prevalence", 'subj_info', 'thanks']; //"one_slider", "multi_slider", 'subj_info', 'thanks'];

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