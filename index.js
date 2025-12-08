// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
import { GoogleGenAI, Type } from "https://esm.run/@google/genai";

// Initialize the client
const fakeConfig = {
    apiKey: "@Hy`Rx@fYkfY0AcxHw^r8jw0TkI3pgLkYKugw2X",
    authDomain: "ehbshnm`qx,d84c2-ehqda`rd`oo-bnl",
    projectId: "ehbshnm`qx,d84c2",
    storageBucket: "ehbshnm`qx,d84c2-ehqda`rdrsnq`fd-`oo",
    messagingSenderId: "80656/170722",
    appId: "0980656/1707229vda9e86be14437b157/8bac7e7",
    measurementId: "F,6O3U/30F1O"
};

const fakeAIConfig = {
    key: "BJ{bTzEctmoRiH.P1jNM2UzRdC.::sIFT4cQMNR"
};
const aiConfig = shiftConfigAlphaNum(fakeAIConfig, 1);
const firebaseConfig = shiftConfigAlphaNum(fakeConfig, -1);

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

const submitWordEl = document.getElementById('word');
submitWordEl.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && !event.shiftKey) { // If Enter is pressed without Shift
        event.preventDefault(); // Prevent newline
        submitWord();
    }
});

const submitDefinitionEl = document.getElementById('definition');
submitDefinitionEl.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && !event.shiftKey) { // If Enter is pressed without Shift
        event.preventDefault(); // Prevent newline
        submitWord();
    }
});

// Call loadCurrentWordAndPhase when the page loads
window.onload = function() {
    loadCurrentWordAndPhase();
    updateDefinitionCount();
    updatePlayerCount();
    setUseAICheckbox();
}

function setUseAICheckbox() {
    // Initialize the AI usage checkbox based on whether "Google Gemini" player exists
    database.ref('players/Google Gemini').once('value', function(snapshot) {
        const checkbox = document.getElementById('checkboxUseAI');
        if (checkbox) {
            checkbox.checked = !!snapshot.exists();
        }
    });
}

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

// Function to submit a new word
export function submitWord() {
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
export async function startDefinitions() {
    const word = document.getElementById('currentWord').innerText;
    if (word === '' || word === 'Waiting for next word...') {
        console.error('Please submit a word before starting definition submissions!');
        return;
    }

    database.ref('gamePhase').set('definitionSubmission');
    if (document.getElementById('checkboxUseAI').checked) {
        const word = document.getElementById('currentWord').innerText;
        console.log("Generating AI definition for word: " + word);
        const aiDef = await getGeneratedDefinition(word);
        submitDefinition(aiDef);
    }
}

// Function to submit a definition
export function submitDefinition(aiDef) {
    let definition = '';
    if (aiDef) {
        definition = aiDef;
    }
    else {
        definition = document.getElementById('definition').value.trim();
    }

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
export function endSubmissions() {
    database.ref('definitions').once('value', function(snapshot) {
        const definitionCount = snapshot.numChildren();
        database.ref('players').once('value', function(playersSnapshot) {
            const playerCount = playersSnapshot.numChildren();
            if (definitionCount < playerCount) {
                console.log(`Warning: Only ${definitionCount} definitions for ${playerCount} players`);
            }
        });
    });
    database.ref('definitions').once('value', function(snapshot) {
        const definitions = [];
        const definitionCount = snapshot.numChildren();
        let cont = true;
        database.ref('players').once('value', function(playersSnapshot) {
            const playerCount = playersSnapshot.numChildren();
            if (definitionCount < playerCount) {
                cont = confirm('Are you sure everyone has submitted their definitions?')
            }
        });
        if (!cont) {
            return;
        }
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
export function nextRound() {
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
    document.getElementById('useAI').style.display = 'none';
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
        document.getElementById('useAI').style.display = 'flex';
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
    if (!rawName || rawName == "Google Gemini") return;
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
            updatePlayerCount();
        }).catch((error) => {
            console.error('Error adding player: ' + error.message);
        });
    } else {
        playerRef.remove().then(() => {
            console.log('Player removed successfully!');
            updatePlayerCount();
        }).catch((error) => {
            console.error('Error removing player: ' + error.message);
        });
    }
}

function updatePlayerCount() {
    database.ref('players').once('value', function(snapshot) {
        const count = snapshot.numChildren();
        const playersHeader = document.getElementById('playersHeader');
        if (playersHeader) {
            playersHeader.textContent = `Players (${count})`;
        }
    });
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
export function changePlayerPoints(event, delta) {
    const item = event.target.closest('div.playerItem');
    if (!item) return;
    const key = item.dataset.playerId;
    const scoreRef = database.ref('players/' + key + '/score');
    scoreRef.transaction(current => (current || 0) + delta);
}

// Called by the Remove button in the player list
export function removePlayer(event) {
    const item = event.target.closest('.playerItem');
    if (!item) return;
    const key = item.dataset.playerId;
    if (!key) return;
    editPlayers(key, false);
    setUseAICheckbox();
}

// Function to clear all players
export function clearAllPlayers() {
    if (confirm('Are you sure you want to clear all players?')) {
        database.ref('players').remove().then(() => {
            console.log('All players cleared successfully!');
        }).catch((error) => {
            console.error('Error clearing players: ' + error.message);
        });
        document.getElementById('checkboxUseAI').checked = false;
    }
}

// Function to clear all scores
export function clearScores() {
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

export function toggleUseAI() {
    const checkbox = document.getElementById('checkboxUseAI');
    if (checkbox.checked) {
        editPlayers('Google Gemini', true, 'Google Gemini');
    } 
    else {
        editPlayers('Google Gemini', false);
    }
}

async function getGeneratedDefinition(word) {
    if (word=="") {
        return;
    }
    const ai = new GoogleGenAI({ apiKey: aiConfig.key });
    const modelId = "gemini-2.5-flash"; 

    try {
        const response = await ai.models.generateContent({
        model: modelId,
        contents: `Generate a realistic but completely fake dictionary definition for the word "${word}". 
        
        Guidelines:
        1. Tone: Emulate the tone and style of a high school student attempting to fool others with a fake definition of an unfamiliar word.
        2. Focus on concrete, tangible definitions rather than abstract concepts.
        3. Describe observable objects, actions, or feature in a straightforward way.
        4. Be 1-2 sentences in length, with definitions ranging in number and length of words used.
        5. Do not include the word itself in the definition, even as a preface.
        6. You are only allowed to use 4 words that are over 6 letters long.
        7. The definition must be sematically unique from the real definition of the word.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
            type: Type.OBJECT,
            properties: {
                definition: { type: Type.STRING, description: "The fabricated definition text." }
            },
            required: ["definition"]
            }
        }
        });

        if (response.text) {
            const responseData = JSON.parse(response.text);
            const definition = responseData.definition.trim();
            console.log("Generated definition: " + definition);
            return definition;
        } 
        else {
            throw new Error("No response text received");
        }
    } 
    catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
}

// Expose functions to global window object for onclick handlers
window.submitWord = submitWord;
window.startDefinitions = startDefinitions;
window.submitDefinition = submitDefinition;
window.endSubmissions = endSubmissions;
window.nextRound = nextRound;
window.addPlayer = addPlayer;
window.changePlayerPoints = changePlayerPoints;
window.removePlayer = removePlayer;
window.clearAllPlayers = clearAllPlayers;
window.clearScores = clearScores;
window.toggleUseAI = toggleUseAI