this.Documents = new Mongo.Collection("documents");
EditingUsers = new Mongo.Collection("editingUsers");

if (Meteor.isClient) {

	Template.editor.helpers({
		docid:function(){
			setupCurrentDocument();
			return Session.get("docid");
		},

		config:function(){
			return function(editor){
				editor.setOption("lineNumbers",true);
				editor.setOption("theme","cobalt");
				editor.on("change",function(cm_editor,info){
					/*console.log(cm_editor.getValue());
					$("#viewer_iframe").contents().find("html").html(cm_editor.getValue());*/
					Meteor.call("addEditingUser");
				});
			}
		}
	});

	Template.editingUsers.helpers({
		users:function(){ // return users editing current document
			var doc,eusers,users;
			doc=Documents.findOne();
			if(!doc){return;} //givr up
			eusers=EditingUsers.findOne({docid:doc._id});
			if(!eusers){return;} // give up
			users = new Array();
			var i=0;
			for(var user_id in eusers.users){
				users[i]=fixObjectKeys(eusers.users[user_id]);
				i++;
			}
			return users;
		}
	})

	Template.noteHeader.helpers({
		documents:function(){
			return Documents.find({});
		}
	})

	Template.docMeta.helpers({
		document:function(){
			return Documents.findOne({_id:Session.get("docid")});
		}
	})

	Template.editableText.helpers({
		userCanEdit:function(doc,collection){
			//can edit if the doc is owned by me
			doc=Documents.findOne({_id:Session.get("docid"), owner:Meteor.userId()});
			if(doc){
				return true;
			}else{
				return false;
			}
		}
	})

/////////
//Events
/////////

	Template.noteHeader.events({
		"click .js-add-doc":function(event){
			event.preventDefault();
			console.log(" Add a new Doc");
			if(!Meteor.user()){
				alert("You need to login first");
			}else{
				//They are logged in lets add a document
				var id = Meteor.call("addDoc", function(err, res){
					if(!err){//all good
						console.log("callback recieved: "+res);
						Session.set("docid",res);
					}
				}); // DB ops only works from methods.
			}
		},

		"click .js-load-doc":function(event){
			console.log(this);
			Session.set("docid",this._id);

		}
	})

	Template.docMeta.events({
		"click .js-tog-private":function(event){
			console.log(event.target.checked);
			var doc={_id:Session.get("docid"), isPrivate:event.target.checked};
			Meteor.call("updateDocPrivacy", doc);

		}
	})

} // End isClient





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
	addDoc:function(){
		var doc;
		if(!this.userId){// NOt logged in
			return;
		}else{
			doc={
				owner:this.userId, 
				createdOn:new Date(), 
				title:"New Doc"
			};
			var id = Documents.insert(doc);
			return id; //return was missing. caused problem in method call.
		}
	},
	updateDocPrivacy:function(doc){
		console.log("updateDocPrivacy Method");
		console.log(doc);

		var realDoc=Documents.findOne({_id:doc._id, owner:this.userId});
		if(realDoc){
			realDoc.isPrivate=doc.isPrivate;
			Documents.update({_id:doc._id}, realDoc);
		}

	},

	addEditingUser:function(){
		var doc, user, eusers;

		doc = Documents.findOne();
		if(!doc){return;} //No Doc Give up.
		if(!this.userId){return;}// No Loggen in user Give up.
		//NOw i have a doc anf possibly a user.

		user=Meteor.user().profile;
		eusers=EditingUsers.findOne({docid:doc._id});
		if(!eusers){
			eusers={
				docid:doc._id,
				users:{},
			};
		}
		user.lastEdit = new Date();
		eusers.users[this.userId] = user;
		EditingUsers.upsert({_id:eusers._id},eusers);
	}
	
})

function setupCurrentDocument(){
	var doc;
	if(!Session.get("docid")){// NO doc id Set
		doc = Documents.findOne();
		if(doc){
			Session.set("docid",doc._id);
		}
	}
}

// this renames object keys by removing hyphens to make the compatible 
// with spacebars. 
function fixObjectKeys(obj){
  var newObj = {};
  for (key in obj){
    var key2 = key.replace("-", "");
    newObj[key2] = obj[key];
  }
  return newObj;
}