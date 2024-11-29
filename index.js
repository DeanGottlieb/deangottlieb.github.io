// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAgZlgZ1BdyIx_s9kx1UlJ4qhMlZLvhx3Y",
    authDomain: "fictionary-e95d3.firebaseapp.com",
    projectId: "fictionary-e95d3",
    storageBucket: "fictionary-e95d3.firebasestorage.app",
    messagingSenderId: "917670281833",
    appId: "1:917670281833:web:f97cf25548c26809cbd8f8",
    measurementId: "G-7P4V041G2P"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  var database = firebase.database();
  
  let currentWord = '';
  
  // Load the current word and phase from Firebase and listen for changes in real-time
  function loadCurrentWordAndPhase() {
      database.ref('currentWord').on('value', function(snapshot) {
          const word = snapshot.val();
          if (word) {
              currentWord = word;
              document.getElementById('currentWord').innerHTML = currentWord;
          } else {
              document.getElementById('currentWord').innerHTML = '<em>Waiting for next word...</em>';
          }
      });
  
      database.ref('gamePhase').on('value', function(snapshot) {
          const phase = snapshot.val();
          updateUIForPhase(phase);
      });
  
      database.ref('definitionsOrder').on('value', function(snapshot) {
          const definitionsOrder = snapshot.val();
          if (definitionsOrder) {
              displayDefinitions(definitionsOrder);
          }
      });
  }
  
  // Call loadCurrentWordAndPhase when the page loads
  window.onload = function() {
      loadCurrentWordAndPhase();
      updateDefinitionCount();
  }
  
  // Function to submit a new word
  function submitWord() {
      const word = document.getElementById('word').value.trim();
      if (word === '') {
          console.error('Word cannot be empty!');
          document.getElementById('currentWord').innerHTML = '<em>Waiting for next word...</em>';
          return;
      }
      
      currentWord = word;
      document.getElementById('currentWord').innerHTML = currentWord;
  
      // Save the current word to Firebase
      database.ref('currentWord').set(currentWord).then(() => {
          document.getElementById('wordForm').reset();
          console.log('Word submitted successfully!');
      }).catch((error) => {
          console.error('Error submitting word: ' + error.message);
      });
  }
  
  // Function to start submitting definitions
  function startDefinitions() {
      database.ref('gamePhase').set('definitionSubmission');
  }
  
  // Function to submit a definition
  function submitDefinition() {
      const definition = document.getElementById('definition').value.trim();
      if (definition === '') {
          console.error('Definition cannot be empty!');
          return;
      }
  
      // Save definition to Firebase
      database.ref('definitions').push({
          text: definition
      }).then(() => {
          document.getElementById('definitionForm').reset();
          console.log('Definition submitted successfully!');
          updateDefinitionCount(); // Update the definition count
      }).catch((error) => {
          console.error('Error submitting definition: ' + error.message);
      });
  }
  
  // Function to update the definition count in real-time
  function updateDefinitionCount() {
      database.ref('definitions').on('value', function(snapshot) {
          const count = snapshot.numChildren();
          document.getElementById('definitionCount').innerText = `(${count})`;
      });
  }
  
  // Function to display definitions in the order stored in Firebase
  function displayDefinitions(definitionsOrder) {
      const container = document.getElementById('definitionsContainer');
      container.innerHTML = '';
      definitionsOrder.forEach((definition, index) => {
          const definitionElement = document.createElement('div');
          definitionElement.className = 'definition';
          definitionElement.innerHTML = `${index + 1}. ${definition}`; // Add numbering
          definitionElement.style.display = 'block';
          container.appendChild(definitionElement);
      });
  }
  
  // Function to end submissions
  function endSubmissions() {
      database.ref('definitions').once('value', function(snapshot) {
          const definitions = [];
          snapshot.forEach(function(childSnapshot) {
              definitions.push(childSnapshot.val().text);
          });
          definitions.sort(() => Math.random() - 0.5); // Randomize order
  
          // Save the randomized order to Firebase
          database.ref('definitionsOrder').set(definitions).then(() => {
              database.ref('gamePhase').set('endSubmissions');
          });
      });
  }
  
  // Function to start the next round
  function nextRound() {
      // Clear definitions, definitionsOrder, and current word in Firebase
      database.ref('definitions').remove();
      database.ref('definitionsOrder').remove();
      database.ref('currentWord').remove();
      database.ref('gamePhase').set('wordSubmission');
  
      document.getElementById('definitionsContainer').innerHTML = '';
      currentWord = '';
      document.getElementById('currentWord').innerHTML = '<em>Waiting for next word...</em>';
  }
  
  // Function to update the UI based on the current phase
  function updateUIForPhase(phase) {
      document.getElementById('wordForm').style.display = 'none';
      document.getElementById('startDefinitionsButton').style.display = 'none';
      document.getElementById('submissionHeader').style.display = 'none';
      document.getElementById('definitionForm').style.display = 'none';
      document.getElementById('endSubmissionsButton').style.display = 'none';
      document.getElementById('definitionsHeader').style.display = 'none';
      document.getElementById('nextRoundButton').style.display = 'none';
  
      if (phase === 'definitionSubmission') {
          document.getElementById('submissionHeader').style.display = 'block';
          document.getElementById('definitionForm').style.display = 'block';
          document.getElementById('endSubmissionsButton').style.display = 'block';
      } else if (phase === 'wordSubmission') {
          document.getElementById('wordForm').style.display = 'block';
          document.getElementById('startDefinitionsButton').style.display = 'block';
      } else if (phase === 'endSubmissions') {
          document.getElementById('definitionsHeader').style.display = 'block';
          document.getElementById('nextRoundButton').style.display = 'block';
          // Display the definitions only in the end submissions phase
          database.ref('definitionsOrder').once('value', function(snapshot) {
              const definitionsOrder = snapshot.val();
              if (definitionsOrder) {
                  displayDefinitions(definitionsOrder);
              }
          });
      }
  }
  