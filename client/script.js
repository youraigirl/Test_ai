import bot from './assets/heart.svg';
import user from './assets/user.svg';

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');

let loadInterval

function loader(element) {
  element.textContent = ''

  loadInterval = setInterval(() => {
    // Update the text content of the loading indicator
    element.textContent += '.';

    // If the loading indicator has reached three dots, reset it
    if (element.textContent === '....') {
       element.textContent = '';
    }
  }, 30);
}

function typeText(element, text) {
  let index = 0;

  let interval = setInterval(() => {
    if(index < text.length) {
      element.innerHTML += text.charAt(index);
      index++
    } else {
      clearInterval(interval)

      // Speak the text using TTS
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 1.5;
      const voices = speechSynthesis.getVoices();
      console.log(voices);
      utterance.voice = voices.find(voice => voice.name === 'Microsoft Zira - English (United States)');
      speechSynthesis.speak(utterance);

      // Obtain the list of available voices
      console.log(voices);
      console.log(utterance.voice);

    }
  }, 20)
}

// generate unique ID for each message div of bot
// necessary for typing text effect for that specific reply
// without unique ID, typing text will work on every element
function generateUniqueId() {
  const timestamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16);

  return `id-${timestamp}-${hexadecimalString}`;
}

function chatStripe (isAi, value, uniqueId) {
  return(
    `
    <div class='wrapper ${isAi && 'ai'}'>
      <div class='chat'>
        <div class='profile'>
          <img
            src='${isAi ? bot : user}'
            alt='${isAi ? 'bot' : 'user'}'
          />
        </div>
        <div class='message' id=${uniqueId}>${value}</div>
      </div>
    </div>
    `
  )
}

const handleSubmit = async (e) => {
  e.preventDefault();

  const data = new FormData(form)

  // user's chatstripe
  chatContainer.innerHTML += chatStripe(false, data.get('prompt'))

  // to clear the textarea input
  form.reset()

  // bot's chatstripe
  const uniqueId = generateUniqueId()
  chatContainer.innerHTML += chatStripe(true, " ", uniqueId)

  // to focus scroll to the bottom
  chatContainer.scrollTop = chatContainer.scrollHeight;

  // specific message div
  const messageDiv = document.getElementById(uniqueId);

  // messageDiv.innerHTML = "..."
  loader(messageDiv)

  // fetch data from server --> bot's response
  const response = await fetch('https://test-open-ai.onrender.com', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: data.get('prompt')
    })
  })

  clearInterval(loadInterval)
  messageDiv.innerHTML = ' '

  if(response.ok) {
    const data = await response.json();
    const parsedData = data.bot.trim() // trims any trailing spaces/'\n'

    typeText(messageDiv, parsedData)
  } else {
    const err = await response.text()

    messageDiv.innerHTML = 'Something Went Wrong'
    alert(err)
  }
}

form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', (e) => {
  if (e.keyCode === 13) {
    handleSubmit(e)
  }
})

function initSpeechRecognition() {
  const startRecognitionButton = document.querySelector('#startRecognition');

  startRecognitionButton.addEventListener('click', () => {
    // Check if the browser supports speech recognition
    if ('webkitSpeechRecognition' in window) {
      const recognition = new webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        console.log('Speech recognition started');
      };

      recognition.onresult = (event) => {
        const lastResultIndex = event.results.length - 1;
        const transcript = event.results[lastResultIndex][0].transcript;
        if (event.results[lastResultIndex].isFinal) {
          handleSpokenInput(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };

      recognition.start();
    } else {
      alert('Your browser does not support speech recognition. Please use a browser that supports it, such as Google Chrome.');
    }
  });
}

function handleSpokenInput(transcript) {
  // You can process the transcript here, e.g., send it as a message to the chatbot
  console.log('Spoken input:', transcript);
  // Simulate a form submit event to handle the spoken input as if it was typed
  const submitEvent = new Event('submit');
  form.prompt.value = transcript;
  handleSubmit(submitEvent);
  form.reset(); // Clear the input field after handling the spoken input
}

  


initSpeechRecognition();