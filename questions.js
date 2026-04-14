(function () {
    const ANSWER_FEEDBACK_VISIBLE_MS = 10000;
    const QUESTION_BANK = [
        {
            id: "q1",
            question: "Which is a fixed cost?",
            options: ["Rent", "Materials", "Sales commissions", "Shipping"],
            correct: 0,
            explanation: "Rent does not usually change directly with production volume, so it is a fixed cost."
        },
        {
            id: "q2",
            question: "Contribution margin per unit equals:",
            options: ["Selling price minus variable cost", "Sales minus fixed costs", "Net income minus tax", "Variable cost minus selling price"],
            correct: 0,
            explanation: "Contribution margin per unit is selling price minus variable cost per unit."
        },
        {
            id: "q3",
            question: "If fixed costs rise and everything else stays the same, break-even sales will:",
            options: ["Increase", "Decrease", "Stay the same", "Fall to zero"],
            correct: 0,
            explanation: "Higher fixed costs require more contribution margin to break even."
        },
        {
            id: "q4",
            question: "True or False: Variable cost per unit usually stays constant within the relevant range.",
            options: ["True", "False"],
            correct: 0,
            explanation: "In cost-volume-profit analysis, variable cost per unit is typically assumed constant in the relevant range."
        },
        {
            id: "q5",
            question: "Break-even units are calculated as:",
            options: ["Fixed costs divided by contribution margin per unit", "Variable costs divided by price", "Sales minus expenses", "Profit divided by units sold"],
            correct: 0,
            explanation: "Break-even units equal fixed costs divided by contribution margin per unit."
        },
        {
            id: "q6",
            question: "Which account is increased with a debit in a normal journal entry?",
            options: ["Expense", "Revenue", "Common stock", "Accounts payable"],
            correct: 0,
            explanation: "Expenses normally increase with debits."
        },
        {
            id: "q7",
            question: "True or False: Revenue accounts normally carry credit balances.",
            options: ["True", "False"],
            correct: 0,
            explanation: "Revenue accounts increase with credits and normally carry credit balances."
        },
        {
            id: "q8",
            question: "If a company collects cash from a customer on account, which happens?",
            options: ["Cash increases and Accounts Receivable decreases", "Cash decreases and Revenue decreases", "Cash increases and Revenue increases", "Accounts Receivable increases and Cash decreases"],
            correct: 0,
            explanation: "Collecting a receivable increases cash and reduces Accounts Receivable."
        },
        {
            id: "q9",
            question: "True or False: Depreciation is a non-cash expense.",
            options: ["True", "False"],
            correct: 0,
            explanation: "Depreciation reduces accounting income but does not require a current cash payment."
        },
        {
            id: "q10",
            question: "Which financial statement reports revenues and expenses?",
            options: ["Income statement", "Balance sheet", "Statement of cash flows", "Statement of retained earnings only"],
            correct: 0,
            explanation: "The income statement reports revenues, expenses, and net income."
        },
        {
            id: "q11",
            question: "If selling price increases while variable cost stays the same, contribution margin will:",
            options: ["Increase", "Decrease", "Stay the same", "Become negative"],
            correct: 0,
            explanation: "A higher selling price increases contribution margin."
        },
        {
            id: "q12",
            question: "True or False: The balance sheet is a snapshot at one point in time.",
            options: ["True", "False"],
            correct: 0,
            explanation: "The balance sheet shows assets, liabilities, and equity on a specific date."
        },
        {
            id: "q13",
            question: "Gross profit equals:",
            options: ["Sales minus cost of goods sold", "Sales minus operating expenses", "Cash received minus cash paid", "Assets minus liabilities"],
            correct: 0,
            explanation: "Gross profit is sales revenue less cost of goods sold."
        },
        {
            id: "q14",
            question: "True or False: Unearned revenue is a liability until the service is provided.",
            options: ["True", "False"],
            correct: 0,
            explanation: "Unearned revenue represents an obligation to provide goods or services in the future."
        },
        {
            id: "q15",
            question: "Which of the following is most likely a variable cost?",
            options: ["Direct materials", "Property tax", "Factory rent", "CEO salary"],
            correct: 0,
            explanation: "Direct materials usually vary with production volume."
        },
        {
            id: "q16",
            question: "The accounting equation is:",
            options: ["Assets = Liabilities + Equity", "Assets = Revenue - Expenses", "Cash = Sales - Costs", "Liabilities = Assets + Equity"],
            correct: 0,
            explanation: "The basic accounting equation is Assets = Liabilities + Equity."
        },
        {
            id: "q17",
            question: "True or False: A higher contribution margin lowers the break-even point.",
            options: ["True", "False"],
            correct: 0,
            explanation: "Higher contribution margin means each unit covers fixed costs faster, so break-even falls."
        },
        {
            id: "q18",
            question: "Which action increases total assets and total liabilities at the same time?",
            options: ["Borrowing cash from a bank", "Paying cash to suppliers", "Recording depreciation", "Issuing a dividend"],
            correct: 0,
            explanation: "Borrowing cash increases cash and increases a liability such as notes payable."
        },
        {
            id: "q19",
            question: "True or False: Cost behavior analysis often separates mixed costs into fixed and variable components.",
            options: ["True", "False"],
            correct: 0,
            explanation: "Mixed costs contain both fixed and variable components and are often split for analysis."
        },
        {
            id: "q20",
            question: "If variable cost per unit rises while selling price stays the same, break-even units will:",
            options: ["Increase", "Decrease", "Stay the same", "Become impossible to compute"],
            correct: 0,
            explanation: "Higher variable cost reduces contribution margin, which increases the break-even point."
        }
    ];

    const QUESTION_CATEGORY_MAP = {
        q1: ["cost", "managerial"],
        q2: ["cost", "managerial"],
        q3: ["cost", "managerial"],
        q4: ["cost", "managerial"],
        q5: ["cost", "managerial"],
        q6: ["financial"],
        q7: ["financial"],
        q8: ["financial"],
        q9: ["financial"],
        q10: ["financial"],
        q11: ["cost", "managerial"],
        q12: ["financial"],
        q13: ["financial", "managerial"],
        q14: ["financial"],
        q15: ["cost", "managerial"],
        q16: ["financial"],
        q17: ["cost", "managerial"],
        q18: ["financial"],
        q19: ["cost", "managerial"],
        q20: ["cost", "managerial"]
    };

    function normalizeCategory(category) {
        const normalized = String(category || "mixed").toLowerCase();
        return ["cost", "financial", "managerial", "mixed"].indexOf(normalized) >= 0
            ? normalized
            : "mixed";
    }

    QUESTION_BANK.forEach(function (question) {
        question.categories = (QUESTION_CATEGORY_MAP[question.id] || ["mixed"]).slice();
    });

    function shuffleArray(items) {
        const copy = items.slice();
        for (let index = copy.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            const temp = copy[index];
            copy[index] = copy[swapIndex];
            copy[swapIndex] = temp;
        }
        return copy;
    }

    class QuestionEngine {
        constructor(root, questionTextEl, optionsEl, feedbackEl, config) {
            this.root = root;
            this.questionTextEl = questionTextEl;
            this.optionsEl = optionsEl;
            this.feedbackEl = feedbackEl;
            this.currentQuestion = null;
            this.resolveAnswer = null;
            this.lastQuestionId = null;
            this.deck = [];
            this.category = normalizeCategory(config && config.category);
            this.handleKeydown = this.handleKeydown.bind(this);
            this.buildDeck();
        }

        setCategory(category) {
            this.category = normalizeCategory(category);
            this.deck = [];
            this.buildDeck();
        }

        getFilteredBank() {
            if (this.category === "mixed") {
                return QUESTION_BANK;
            }

            const filtered = QUESTION_BANK.filter((question) => {
                return question.categories.indexOf(this.category) >= 0;
            });

            return filtered.length ? filtered : QUESTION_BANK;
        }

        prepareQuestion(question) {
            const correctAnswer = question.options[question.correct];
            const shuffledOptions = shuffleArray(question.options);

            return Object.assign({}, question, {
                options: shuffledOptions,
                correct: shuffledOptions.indexOf(correctAnswer)
            });
        }

        buildDeck() {
            this.deck = shuffleArray(this.getFilteredBank()).map((question) => {
                return this.prepareQuestion(question);
            });

            if (this.lastQuestionId && this.deck.length > 1 && this.deck[0].id === this.lastQuestionId) {
                const swap = this.deck[0];
                this.deck[0] = this.deck[1];
                this.deck[1] = swap;
            }
        }

        nextQuestion() {
            if (!this.deck.length) {
                this.buildDeck();
            }

            const question = this.deck.shift();
            this.lastQuestionId = question.id;
            return question;
        }

        applyDensityClass(question) {
            const totalLength = question.question.length + question.options.join(" ").length;
            const longestOptionLength = question.options.reduce((longest, option) => {
                return Math.max(longest, option.length);
            }, 0);
            const questionLength = question.question.length;

            this.root.classList.remove("question-box--dense", "question-box--extra-dense", "question-box--ultra-dense");

            if (totalLength > 190 || longestOptionLength > 72 || questionLength > 92) {
                this.root.classList.add("question-box--ultra-dense");
            } else if (totalLength > 150 || longestOptionLength > 58 || questionLength > 74) {
                this.root.classList.add("question-box--extra-dense");
            } else if (totalLength > 115 || longestOptionLength > 46 || questionLength > 60) {
                this.root.classList.add("question-box--dense");
            }
        }

        renderQuestion(question) {
            this.currentQuestion = question;
            this.applyDensityClass(question);
            this.questionTextEl.textContent = question.question;
            this.optionsEl.innerHTML = "";
            this.feedbackEl.textContent = "";
            this.feedbackEl.dataset.state = "";

            question.options.forEach((option, index) => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "option-button";
                button.innerHTML = `
                    <span class="option-number">${index + 1}.</span>
                    <span class="option-label">${option}</span>
                `;
                button.addEventListener("click", () => {
                    this.submitAnswer(index);
                });
                this.optionsEl.appendChild(button);
            });
        }

        submitAnswer(index) {
            if (!this.currentQuestion || !this.resolveAnswer) {
                return;
            }

            const isCorrect = index === this.currentQuestion.correct;
            const explanation = this.currentQuestion.explanation || "";

            Array.from(this.optionsEl.querySelectorAll("button")).forEach((button) => {
                button.disabled = true;
            });

            this.feedbackEl.dataset.state = isCorrect ? "correct" : "wrong";
            this.feedbackEl.textContent = `${isCorrect ? "Correct." : "Incorrect."} ${explanation}`;

            const resolver = this.resolveAnswer;
            const question = this.currentQuestion;
            this.resolveAnswer = null;

            window.setTimeout(() => {
                this.hide();
                resolver({
                    isCorrect: isCorrect,
                    question: question
                });
            }, ANSWER_FEEDBACK_VISIBLE_MS);
        }

        handleKeydown(event) {
            if (this.root.classList.contains("hidden")) {
                return;
            }

            const keyMap = {
                Digit1: 0,
                Numpad1: 0,
                Digit2: 1,
                Numpad2: 1,
                Digit3: 2,
                Numpad3: 2,
                Digit4: 3,
                Numpad4: 3
            };

            if (Object.prototype.hasOwnProperty.call(keyMap, event.code)) {
                event.preventDefault();
                const choice = keyMap[event.code];
                if (this.currentQuestion && choice < this.currentQuestion.options.length) {
                    this.submitAnswer(choice);
                }
            }
        }

        show() {
            this.root.classList.remove("hidden");
            window.addEventListener("keydown", this.handleKeydown);
        }

        hide() {
            this.root.classList.add("hidden");
            window.removeEventListener("keydown", this.handleKeydown);
            this.currentQuestion = null;
        }

        ask(options) {
            if (this.resolveAnswer) {
                return Promise.resolve({ isCorrect: false, question: null });
            }

            const question = this.nextQuestion();
            this.renderQuestion(question);
            this.show();

            return new Promise((resolve) => {
                this.resolveAnswer = resolve;

                if (options && options.autoCorrect) {
                    window.setTimeout(() => {
                        if (this.currentQuestion && this.resolveAnswer) {
                            this.submitAnswer(this.currentQuestion.correct);
                        }
                    }, 450);
                }
            });
        }
    }

    window.LedgerLegends = window.LedgerLegends || {};
    window.LedgerLegends.QuestionEngine = QuestionEngine;
    window.LedgerLegends.QUESTION_BANK = QUESTION_BANK;
})();
