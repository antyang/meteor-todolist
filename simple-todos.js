// if (Meteor.isClient) {
//   // counter starts at 0
//   Session.setDefault('counter', 0);

//   Template.hello.helpers({
//     counter: function () {
//       return Session.get('counter');
//     }
//   });

//   Template.hello.events({
//     'click button': function () {
//       // increment the counter when button is clicked
//       Session.set('counter', Session.get('counter') + 1);
//     }
//   });
// }

// if (Meteor.isServer) {
//   Meteor.startup(function () {
//     // code to run on server at startup
//   });
// }

// if (Meteor.isClient) {
//   // This code only runs on the client
//   Template.body.helpers({
//     tasks: [
//       { text: "This is task 1" },
//       { text: "This is task 2" },
//       { text: "This is task 3" }
//     ]
//   });
// }

Tasks = new Mongo.Collection("tasks");

if (Meteor.isServer){
  // this code only runs on the server
  // only publish tasks that are public or belong to user
  Meteor.publish("tasks", function(){
    return Tasks.find({
      $or: [
        { private: { $ne: true } },
        { owner: this.userId }
      ]
    });
  });
}

if (Meteor.isClient){
  // this code only runs on the client
  Meteor.subscribe("tasks");

  Template.body.helpers({
    tasks: function(){
      if (Session.get("hideCompleted")) {
        // if hidecompleted is checked, filter tasks
        return Tasks.find({checked: {$ne: true}}, {sort: {createdAt: -1}});
      } else {
        return Tasks.find({}, {sort: {createdAt: -1}});
      }
    },
    hideCompleted: function(){
      return Session.get("hideCompleted");
    },
    incompleteCount: function(){
      return Tasks.find({checked: {$ne: true}}).count();
    }
  });

  Template.body.events({
    "submit .new-task": function(event){
      // prevent default browser form submit
      event.preventDefault();

      // get value from form element
      var text = event.target.text.value;

      if ( text === "" || text === " "){
        return false;
      }
      
      // insert a task into the collection
      Meteor.call("addTask", text);

      // now clear form
      event.target.text.value = "";
    },
    "change .hide-completed input": function (event){
      Session.set("hideCompleted", event.target.checked);
    }
  });

  // private
  Template.task.helpers({
    isOwner: function(){
      return this.owner === Meteor.userId();
    }
  });

  Template.task.events({
    "click .toggle-checked": function(){
      // set the checked property to the opposite of it's current value
      Meteor.call("setChecked", this._id, ! this.checked);
    },
    "click .delete": function(){
      Meteor.call("deleteTask", this._id);
    },
    "click .toggle-private": function(){
      Meteor.call("setPrivate", this._id, ! this.private);
    }
  });

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });

}

// After removing insecure package, create all the methods here
Meteor.methods({
  addTask: function(text){
    // make sure the user is logged in before inserting as task
    if(! Meteor.userId()){
      throw new Meteor.Error("not-authorized");
    }

    Tasks.insert({
      text: text,
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username
    });
  },
  deleteTask: function(taskId) {
    // add extra security methods
    var task = Tasks.findOne(taskId);
      if (task.owner !== Meteor.userId() ) {
        // if the task is private, make sure only the owner can delete it
        alert('This task does not belong to you');
        throw new Meteor.Error("not-authorized");
      }
    
    Tasks.remove(taskId);
  },
  setChecked: function(taskId, setChecked){
    var task = Tasks.findOne(taskId);
      if (task.private && task.owner !== Meteor.userId() ) {
        // if the task is private, make sure only the owner can check it
        throw new Meteor.Error("not-authorized");
      }

    Tasks.update(taskId, { $set: { checked: setChecked} });
  },
  setPrivate: function(taskId, setToPrivate){
    var task = Tasks.findOne(taskId);

    // make sure only the task owner can make a task private
    if(task.owner !== Meteor.userId()){
      throw new Meteor.Error("not-authorized");
    }
    Tasks.update(taskId, { $set: { private: setToPrivate} });
  }
});















