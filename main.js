const game = document.querySelector("#game")
const wordsWindow = document.querySelector("#word-window")
const optionsWindow = document.querySelector("#options-window")

const yesWordsListEl = document.querySelector("#yes-words-list")
const noWordsListEl = document.querySelector("#no-words-list")
const allWordsListEl = document.querySelector("#all-words-list")

const wordEl = document.querySelector("#word")
const pointsEl = document.querySelector("#points")

const wordListListEl = document.querySelector("#word-list-list")

const yesButton = document.querySelector("#yes")
const noButton = document.querySelector("#no") // Disabled

const hideWordButton = document.querySelector("#hide-word")
const markAttemptButton = document.querySelector("#mark-attempt")
const skipWordButton = document.querySelector("#skip-word")
const markSuccessButton = document.querySelector("#mark-success")

const exportButton = document.querySelector("#export")
const exportResults = document.querySelector("#export-results")

/// State

let wordListOrderCounter = 0
let wordPracticeCounter = 0

const YES = Symbol("YES")
const NO = Symbol("NO")

class Word {
	constructor(text) {
		this.text = text
		this.history = []
		this.practiceOrder = 0
	}
	
	get hasPracticed() {
		return this.history.length > 0
	}
	get isYes() {
		return this.history[this.history.length-1] === YES
	}
	get isNo() {
		return this.history[this.history.length-1] === NO
	}
	get hasNo() {
		return this.history.includes(NO)
	}
	
	markNo() {
		this.history.push(NO)
		this.practiceOrder = wordPracticeCounter++
	}
	markYes() {
		this.history.push(YES)
		this.practiceOrder = wordPracticeCounter++
	}
	
	toString() {
		return this.text
	}
}

const WORD_LIST_END = new Word("END REACHED")
class WordList {
	constructor(name, words) {
		this.name = name
		this.words = words.map(text => new Word(text))
		this.index = 0
		this.word = this.words[this.index]
		this.order = wordListOrderCounter++
	}
	
	isAtEnd() {
		return this.index + 1 >= this.words.length
	}
	
	setWord(word) {
		this.index = this.words.indexOf(word)
		this.word = this.words[this.index]
	}
	
	/** Returns the previous word if the index was incremented */
	next() {
		let lastWord = this.word
		if (this.words.length > this.index + 1) {
			this.word = this.words[++this.index]
			return lastWord
		} else {
			if (this.word === WORD_LIST_END) return;
			this.word = WORD_LIST_END
			return lastWord
		}
	}
}

let wordLists = [
	new WordList("List A", ["see", "I", "the", "you", "can", "me", "and", "we", "on", "is"]),
	new WordList("List B", ["yes", "are", "no", "isn't", "he", "she", "get", "can't", "under", "to"]),
	new WordList("List C", ["was", "wasn't", "go", "down", "saw", "my", "where", "here", "by", "they"]),
	new WordList("List D", ["little", "put", "what", "do", "like", "have", "home", "said", "her", "of"]),
	new WordList("List E", ["out", "name", "some", "come", "make", "say", "says", "be", "look", "there"]),
	new WordList("List F", ["over", "want", "water", "from", "for", "find", "people", "again", "many", "your"]),
	new WordList("List G", ["very", "were", "could", "should", "would", "one", "two", "both", "good", "does"]),
	new WordList("List H", ["other", "woman", "women", "every", "around", "toward", "their", "children", "heard", "give"]),
	new WordList("List I", ["live", "so", "why", "fly", "all", "ball", "call", "small", "our", "day"]),
	new WordList("List J", ["way", "play", "old", "cold", "gold", "any", "many", "bird", "goes", "too"]),
	new WordList("List K", ["father", "walk", "talk", "mother", "brother", "food", "been", "large", "after", "carry"]),
	new WordList("List L", ["wild", "child", "friend", "school", "full", "pull", "watch", "don’t", "won’t", "most"]),
	new WordList("List M", ["read", "move", "ready", "today", "work", "great", "who", "push", "done", "gone"]),
	new WordList("List N", ["few", "sure", "word", "because", "love", "answer", "nothing", "once", "ago", "kind"]),
	new WordList("List O", ["mind", "ever", "never", "even", "change", "only", "won", "often", "head", "bread"]),
	new WordList("List P", ["four", "beautiful", "true", "blue", "Mr.", "Mrs.", "Ms.", "Miss", "whole", "whose"]),
	new WordList("List Q", ["who’s", "picture", "eye", "guess", "busy", "build", "built", "hour", "buy", "month"]),
	new WordList("List R", ["shoe", "piece", "money", "key", "door", "floor", "half", "toe", "eight", "tie"]),
	new WordList("List S", ["pie", "lie", "young", "caught", "climb", "bought", "brought", "thought", "learn", "heard"]),
	new WordList("List T", ["earth", "early", "group", "through", "since", "either", "neither", "heart", "enough"])
]

let wordListIndex = 0
let customWordListIndex = 0
let isWordHidden = false

let points = 0

let gameOver = false

/// Logic

function getCurrentWordList() {
	return wordLists[wordListIndex]
}
function nextWordList() {
	if (wordListIndex + 1 < wordLists.length) {
		wordListIndex += 1
		getCurrentWordList().setWord(getCurrentWordList().words[0])
	}
}
function setWord(wordList, word) {
	wordList.setWord(word)
	wordListIndex = wordLists.indexOf(wordList)
}

function getResults() {
	let firstNoWordList = "none"
	let lastWordList = "none"
	for (let wl of wordLists) {
		for (let w of wl.words) {
			if (w.hasPracticed) {
				lastWordList = wl.name
				break
			}
		}
	}
	
	let attemptedWords = [].concat(...wordLists.map(wl => wl.words.filter(w => w.hasNo)))
	
	for (let wl of wordLists) {
		for (let w of wl.words) {
			if (w.hasNo) {
				firstNoWordList = wl.name
				break
			}
		}
	}
	
	return `First Marked Attempt: ${firstNoWordList}
Last List: ${lastWordList}
` +
		attemptedWords.map(w => `${w} (${w.history.filter(x=>x===NO).length})`).join(", ")
}

/// Interaction

yesButton.addEventListener("click", () => {
	let word = getCurrentWordList().word
	let atEnd = getCurrentWordList().isAtEnd()
	if (getCurrentWordList().next()) {
		if (!word.hasPracticed) {
			points += 1
		}
		word.markYes()
	}
	
	if (atEnd) {
		nextWordList()
	}
	
	draw()
})
noButton.addEventListener("click", () => {
	let word = getCurrentWordList().word
	let atEnd = getCurrentWordList().isAtEnd()
	if (getCurrentWordList().next()) {
		word.markNo()
	}
	
	if (atEnd) {
		nextWordList()
	}
	
	draw()
})

exportButton.addEventListener("click", () => {
	let results = getResults()
	exportResults.value = results
	exportResults.hidden = false
	
	draw()
})

function onHideWord() {
	isWordHidden = !isWordHidden
	draw()
}
hideWordButton.addEventListener("click", onHideWord)
document.addEventListener("keydown", (e) => {
	if (e.key === "h") {
		onHideWord()
	}
})

function onMarkAttempt() {
	getCurrentWordList().word.markNo()
}
markAttemptButton.addEventListener("click", onMarkAttempt)
document.addEventListener("keydown", (e) => {
	if (e.key === "t") {
		onMarkAttempt()
	}
})

function onSkipWord() {
	let atEnd = getCurrentWordList().isAtEnd()
	//getCurrentWordList().word.markNo()
	getCurrentWordList().next()
	if (atEnd) {
		nextWordList()
	}
	draw()
}
skipWordButton.addEventListener("click", onSkipWord)

function onMarkSuccess() {
	getCurrentWordList().word.markYes()
	draw()
}

markSuccessButton.addEventListener("click", onMarkSuccess)

// View

let wordListViews = []
class WordListView {
	constructor(wordList) {
		this.wordList = wordList
		this.element = this.draw()
	}
	
	draw() {
		let isCurrent = getCurrentWordList() === this.wordList
		let div = document.createElement("div")
		div.className = isCurrent ? "word-list selected" : "word-list"
		div.style.order = this.getOrder()
		
		let h1 = document.createElement("h2")
		h1.textContent = this.wordList.name
		h1.className = "title"
		
		let grid = document.createElement("div")
		grid.className = "grid"
		
		for (let word of this.wordList.words) {
			let w = document.createElement("button")
			let className = ""
			if (isCurrent) {
				if (getCurrentWordList().word === word) {
					className = "selected"
				}
			}
			if (!className) {
				if (word.isYes) {
					className = "yes"
				} else if (word.isNo) {
					className = "no"
				}
			}
			
			w.textContent = isCurrent && getCurrentWordList().word === word && isWordHidden ? word.text.split("").map(_ => "_").join("") : word
			w.className = `word-list-word ${className}`
				
			w.addEventListener("click", () => {
				setWord(this.wordList, word)
				draw()
			})
			
			grid.appendChild(w)
		}
		
		div.appendChild(h1)
		div.appendChild(grid)
		return div
	}

	getOrder() {
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder
		let remainder = (wordLists.indexOf(this.wordList) - wordListIndex)
		let modulo = (remainder + wordLists.length) % wordLists.length
		return modulo
	}

	reorder() {
		this.element.style.order = this.getOrder()
	}
}
function wordToUnderlines(word) {
	return word.split("").map(c => (c == "'" || c == "’") ? c :  "_").join(" ")
}
function drawWord() {
	let word = getCurrentWordList().word.text
	
	if (isWordHidden) {
		wordEl.textContent = wordToUnderlines(word)
	} else {
		wordEl.textContent = word
	}
}
function drawPoints() {
	pointsEl.textContent = `Words: ${points}`
}
function drawLists() {	
	yesWordsListEl.innerHTML = "" // Eh
	noWordsListEl.innerHTML = ""
	allWordsListEl.innerHTML = ""
	
	let yesWords = [].concat(...wordLists.map(wl => wl.words.filter(w => w.isYes).map(w => [wl, w])))
	yesWords.sort((a, b) => a[1].practiceOrder - b[1].practiceOrder)
	let noWords = [].concat(...wordLists.map(wl => wl.words.filter(w => w.isNo).map(w => [wl, w])))
	noWords.sort((a, b) => a[1].practiceOrder - b[1].practiceOrder)
	
	function drawWord(className, wordList, word) {
		let b = document.createElement("button")
		b.className = className
		b.textContent = word
		
		b.addEventListener("click", () => {
			setWord(wordList, word)
			draw()
		})
		
		return b
	}
	
	for (let [wordList, yesWord] of yesWords) {
		yesWordsListEl.appendChild(drawWord("results-word yes", wordList, yesWord))
		allWordsListEl.appendChild(drawWord("results-word yes", wordList, yesWord))
	}
	for (let [wordList, noWord] of noWords) {
		noWordsListEl.appendChild(drawWord("results-word no", wordList, noWord))
		allWordsListEl.appendChild(drawWord("results-word no", wordList, noWord))
	}
}
let prevView = undefined
function drawWordLists() {
	let view = wordListViews.find(v => v.wordList === getCurrentWordList())
	if (prevView !== view && prevView) {
		prevView.element.remove()
		prevView.element = prevView.draw()
		wordListListEl.appendChild(prevView.element)
	}
	
	view.element.remove()
	view.element = view.draw()
	wordListListEl.appendChild(view.element)

	prevView = view
	
	for (let view of wordListViews) {
		view.reorder()
	}
}
function drawHideButton() {
	hideWordButton.textContent = isWordHidden ? "Show Word (H)" : "Hide Word (H)"
}
function draw() {
	drawWord()
	drawPoints()
	drawLists()
	drawWordLists()
	drawHideButton()
}

for (let wordList of wordLists) {
	let view = new WordListView(wordList)
	wordListListEl.appendChild(view.element)
	wordListViews.push(view)
}

draw()