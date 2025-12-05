// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const fakeConfig = {
    apiKey: "@Hy`Rx@fYkfY0AcxHw^r8jw0TkI3pgLkYKugw2X",
    authDomain: "ehbshnm`qx,d84c2-ehqda`rd`oo-bnl",
    projectId: "ehbshnm`qx,d84c2",
    storageBucket: "ehbshnm`qx,d84c2-ehqda`rdrsnq`fd-`oo",
    messagingSenderId: "80656/170722",
    appId: "0980656/1707229vda9e86be14437b157/8bac7e7",
    measurementId: "F,6O3U/30F1O"
};

function shiftConfigAlphaNum(config, offset) {
    // Shift only alphanumeric characters by offset
    function shift(str) {
        return str.split('').map(char => {
            const code = char.charCodeAt(0);
            return String.fromCharCode(code - offset);
        }).join('');
    }
    const result = {};
    for (const key in config) {
        if (typeof config[key] === 'string') {
            result[key] = shift(config[key]);
        } else {
            result[key] = config[key];
        }
    }
    return result;
}

function areConfigsEqual() {
    const config = shiftConfigAlphaNum(fakeConfig, -1);
    console.log(config.apiKey === firebaseConfig.apiKey);
    console.log(config.authDomain === firebaseConfig.authDomain)
    console.log(config.projectId === firebaseConfig.projectId)
    console.log(config.storageBucket === firebaseConfig.storageBucket)
    console.log(config.messagingSenderId === firebaseConfig.messagingSenderId)
    console.log(config.appId === firebaseConfig.appId)
    console.log(config.measurementId === firebaseConfig.measurementId)
}

const firebaseConfig = shiftConfigAlphaNum(fakeConfig, -1);

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var database = firebase.database();

let currentWord = '';
  
const addPlayerTextEl = document.getElementById('playerName');

addPlayerTextEl.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && !event.shiftKey) { // If Enter is pressed without Shift
        event.preventDefault(); // Prevent newline
        addPlayer();
    }
});

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
    document.getElementById('definitionsContainer').style.display = 'none';

    if (phase === 'definitionSubmission') {
        document.getElementById('submissionHeader').style.display = 'block';
        document.getElementById('definitionForm').style.display = 'block';
        document.getElementById('endSubmissionsButton').style.display = 'block';
    } else if (phase === 'wordSubmission') {
        document.getElementById('wordForm').style.display = 'inline-flex';
        document.getElementById('startDefinitionsButton').style.display = 'block';
    } else if (phase === 'endSubmissions') {
        document.getElementById('definitionsHeader').style.display = 'block';
        document.getElementById('nextRoundButton').style.display = 'block';
        document.getElementById('definitionsContainer').style.display = 'block';

        // Display the definitions only in the end submissions phase
        database.ref('definitionsOrder').once('value', function(snapshot) {
            const definitionsOrder = snapshot.val();
            if (definitionsOrder) {
                displayDefinitions(definitionsOrder);
            }
        });
    }
}

// Function to add a player
function addPlayer() {
    const rawName = document.getElementById('playerName').value.trim();
    if (!rawName) return;
    const playerKey = sanitizeKey(rawName);
    // store both a safe key and the original display name
    editPlayers(playerKey, true, rawName);
    document.getElementById('playerName').value = '';
}

// Function to add or remove a player (now stores displayName and score)
function editPlayers(playerKey, isAdd, displayName) {
    const playerRef = database.ref('players/' + playerKey);
    if (isAdd) {
        playerRef.set({
            displayName: displayName || playerKey,
            score: 0
        }).then(() => {
            console.log('Player added successfully!');
        }).catch((error) => {
            console.error('Error adding player: ' + error.message);
        });
    } else {
        playerRef.remove().then(() => {
            console.log('Player removed successfully!');
        }).catch((error) => {
            console.error('Error removing player: ' + error.message);
        });
    }
}

// helper to produce a Firebase-safe key from a player name
function sanitizeKey(name) {
    return name.replace(/[.#$\[\]\/]/g, '_');
}

// Listen for player list changes and render the list
database.ref('players').on('value', function(snapshot) {
    renderPlayers(snapshot);
});

function renderPlayers(snapshot) {
    const playersList = document.getElementById('playersList');
    playersList.innerHTML = '';
    const template = document.getElementById('playerItemTemplate');
    if (!template) return;

    snapshot.forEach(child => {
        const key = child.key;
        const data = child.val() || {};
        const node = template.content.firstElementChild.cloneNode(true);
        node.dataset.playerId = key;
        const nameSpan = node.querySelector('.playerName');
        const scoreSpan = node.querySelector('.playerScore');
        if (nameSpan) nameSpan.textContent = data.displayName || key;
        if (scoreSpan) scoreSpan.textContent = (data.score || 0);
        playersList.appendChild(node);
    });
}

// Called by the +/- buttons in the player list
function changePlayerPoints(event, delta) {
    const item = event.target.closest('div.playerItem');
    if (!item) return;
    const key = item.dataset.playerId;
    const scoreRef = database.ref('players/' + key + '/score');
    scoreRef.transaction(current => (current || 0) + delta);
}

// Called by the Remove button in the player list
function removePlayer(event) {
    const item = event.target.closest('.playerItem');
    if (!item) return;
    const key = item.dataset.playerId;
    if (!key) return;
    editPlayers(key, false);
}

// Function to clear all players
function clearAllPlayers() {
    if (confirm('Are you sure you want to clear all players?')) {
        database.ref('players').remove().then(() => {
            console.log('All players cleared successfully!');
        }).catch((error) => {
            console.error('Error clearing players: ' + error.message);
        });
    }
}

// Function to clear all scores
function clearScores() {
    if (confirm('Are you sure you want to clear all scores?')) {
        database.ref('players').once('value', function(snapshot) {
            snapshot.forEach(child => {
                const key = child.key;
                database.ref('players/' + key + '/score').set(0);
            });
            console.log('All scores cleared successfully!');
        }).catch((error) => {
            console.error('Error clearing scores: ' + error.message);
        });
    }
}