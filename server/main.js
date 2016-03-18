
  Meteor.startup(function () {
    // code to run on server at startup
    if(!Documents.findOne()){
    	//No Docs yet
    	Documents.insert({title:"Untitled Document"});
    }
  });

  Meteor.publish("documents", function(){
  	return Documents.find({
  		$or:[
	  		{isPrivate:{$ne:true}},
	  		{owner:this.userId}
  		]
  	});
  })

  Meteor.publish("editingUsers",function(){
  	return EditingUsers.find({});
  })
