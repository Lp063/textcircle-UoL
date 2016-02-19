this.Documents = new Mongo.Collection("documents");
EditingUsers = new Mongo.Collection("editingUsers");

if (Meteor.isClient) {

	Template.editor.helpers({
		docid:function(){
			var doc=Documents.findOne();
			if(doc){
				return doc._id;
			}else{
				return undefined;
			}
		},

		config:function(){
			return function(editor){
				editor.on("change",function(cm_editor,info){
				console.log(cm_editor.getValue());
				$("#viewer_iframe").contents().find("html").html(cm_editor.getValue());
				Meteor.call("addEditingUser");
				});
			}
		}
	});
}


if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
    if(!Documents.findOne()){
    	//No Docs yet
    	Documents.insert({title:"My new Document"});
    }
  });
}

Meteor.methods({
	addEditingUser:function(){
		var doc, user, eusers;

		doc=Documents.findOne();
		if(!doc){return;}
		if(!this.userId){return;}

		user=Meteor.user().profile;
		eusers=EditingUsers.findOne({docid:doc._id});
		if(!eusers){
			eusers={docid=doc._id,};
		}
		EditingUsers.insert({user:"Matthew"});
	}
});