const Modal = {
    toggle(msg = null) {

        Form.clearFields()
        Form.form.removeAttribute("onsubmit")
        Form.form.setAttribute("onsubmit", "Form.submit(event)")

        document
            .querySelector('.modal-overlay')
            .classList.toggle('active')

        document.querySelector('.modal #form h2').innerHTML = msg
    }
}

const Storage = {
    get() {
        return JSON.parse(localStorage.getItem("dev.finances:transaction")) || []
    },

    set(transactions) {
        localStorage.setItem("dev.finances:transaction", JSON.stringify(transactions))
    }
}

const Transaction = {

    all: Storage.get(),

    add(transaction) {

        this.all.push(transaction)

        App.reload()
    },

    remove(index) {
        Transaction.all.splice(index, 1)

        App.reload()
    },

    incomes() {
        let income = 0

        this.all.forEach((transaction) => {
            if (transaction.amount > 0) {
                income += transaction.amount
            }
        })

        return income
    },

    expenses() {
        let expense = 0

        this.all.forEach((transaction) => {
            if (transaction.amount < 0) {
                expense += transaction.amount
            }
        })

        return expense
    },

    total() {
        return this.incomes() + this.expenses()
    },

    editButton(index) {

        Modal.toggle("Editar Transação")

        Form.form.removeAttribute("onsubmit")
        Form.form.setAttribute("onsubmit", `Form.submit(event, ${index})`)

        let { description, amount, date } = this.all[index]

        Form.description.value = description
        Form.amount.value = amount / 100
        console.log(Utils.formatCurrency(amount))

        const splittedDate = date.split('/')
        date = `${splittedDate[2]}-${splittedDate[1]}-${splittedDate[0]}`
        Form.date.value = date



    },

    edit(transaction, index) {
        Transaction.all[index] = transaction
        App.reload()
    }
}

const DOM = {
    transactionsContainer: document.querySelector('#data-table tbody'),

    addTransaction(transaction, index) {
        const tr = document.createElement('tr')
        tr.innerHTML = this.innerHTMLTransaction(transaction, index)
        tr.dataset.index = index

        // Adiciona ID ao Transactions

        Transaction.all[index].id = index


        this.transactionsContainer.appendChild(tr)
    },

    innerHTMLTransaction(transaction, index) {
        const CSSclass = transaction.amount > 0 ? "income" : "expense"

        const amount = Utils.formatCurrency(transaction.amount)

        const html = `
        <td class="description">${transaction.description}</td>
        <td class="${CSSclass}">${amount}</td>
        <td class="date">${transaction.date}</td>
        <td>
            <img onclick="Transaction.remove(${index})" src="./assets/minus.svg" alt="Remover transação">
        </td>
        <td>
            <img onclick="Transaction.editButton(${index})" src="./assets/edit.svg" alt="Editar transação">
        </td>
        `

        return html
    },

    updateBalance() {
        document
            .getElementById('incomeDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.incomes())
        document
            .getElementById('expenseDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.expenses())
        document
            .getElementById('totalDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.total())

    },

    clearTransactions() {
        this.transactionsContainer.innerHTML = ""
    }
}

const Utils = {
    formatAmount(value) {
        value = value * 100

        return Math.round(value)
    },

    formatDate(date) {
        const splittedDate = date.split("-")

        return `${splittedDate[2]}/${splittedDate[1]}/${splittedDate[0]}`
    },

    formatCurrency(value) {
        const signal = Number(value) < 0 ? "-" : ""

        value = String(value).replace(/\D/g, "")

        value = Number(value) / 100

        value = value.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        })

        value = signal + value

        return value
    },

    organizeDate(array) {

        let organizedArray = []
        let auxArray = []

        array.forEach((item, index) => {
            let { date, id } = item

            auxArray.push([date, id])
        })

        auxArray.forEach((item, index) => {
            let splitted = String(item[0]).split("/")
            auxArray[index][0] = `${splitted[2]}/${splitted[1]}/${splitted[0]}`
        })

        organizedArray = auxArray.sort()

        organizedArray.forEach((item, index) => {
            let splitted = String(item[0]).split("/")
            organizedArray[index][0] = `${splitted[2]}/${splitted[1]}/${splitted[0]}`
        })

        return organizedArray

    }
}

const Form = {

    form: document.querySelector('.modal #form form'),
    description: document.querySelector('input#description'),
    amount: document.querySelector('input#amount'),
    date: document.querySelector('input#date'),

    getValues() {
        return {
            description: this.description.value,
            amount: this.amount.value,
            date: this.date.value
        }

    },

    formatValues() {
        let { description, amount, date } = this.getValues()

        amount = Utils.formatAmount(amount)
        date = Utils.formatDate(date)

        return {
            description,
            amount,
            date,
        }
    },

    validateFields() {
        const { description, amount, date } = this.getValues()

        if (description.trim() === "" || amount.trim() === "" || date.trim() === "") {
            throw new Error("Por favor, preencha todos os campos!")
        }
    },

    clearFields() {
        this.description.value = ""
        this.amount.value = ""
        this.date.value = ""
    },

    submit(event, edit) {
        event.preventDefault()

        if(edit != undefined) {
            this.saveEdit(edit)
        } else {
            this.saveNew()
        }
    },

    saveEdit(index) {
        try {
            this.validateFields()
            const transaction = this.formatValues()

            Transaction.edit(transaction, index)

            this.clearFields()

            Modal.toggle()
        } catch (error) {
            alert(error.message)
        }
    },

    saveNew() {
        try {
            this.validateFields()
            const transaction = this.formatValues()

            console.log(transaction)

            Transaction.add(transaction)
            this.clearFields()

            Modal.toggle()

        } catch (error) {

            alert(error.message)
        }
    }
}

const Graphics = {
    ctx: document.getElementById("line-chart"),

    optionsChart: {
        type: "line",
        
        data: {
            labels: [],
            datasets: [
                {
                    label: "Entradas",
                    data: [],
                    borderWidth: 3.5,
                    borderColor: "#3dd705",
                    backgroundColor: "transparent",
                    pointBorderColor: "#3dd705",
                    pointBackgroundColor: "#3dd705"
                },
                {
                    label: "Saídas",
                    data: [],
                    borderWidth: 3.5,
                    borderColor: "#e92929",
                    backgroundColor: "transparent",
                    pointBorderColor: "#e92929",
                    pointBackgroundColor: "#e92929"
                }

            ]
        },
        options: {
            maintainAspectRatio: true,
            
            title: {
                display: true,
                fontSize: 20,
                text: "Gráfico de Entradas e Saídas",
                fontColor: "#ffffff"
            },

            legend: {
                labels: {
                    fontColor: "#ffffff"
                }
            },

        }
    },

    updateDatas() {

        let organized = Utils.organizeDate(Transaction.all)

        lineChart.data.labels = []
        lineChart.data.datasets[0].data = []
        lineChart.data.datasets[1].data = []


        organized.forEach((organized, organizedIndex) => {
            Transaction.all.forEach((transaction, transactionIndex) => {

                if (organized[1] === transaction.id) {

                    let index = lineChart.data.labels.findIndex((label) => {return label == organized[0]})

                    //Não existe label
                    if(index === -1) {
                        lineChart.data.labels.push(organized[0])

                        if (transaction.amount > 0) {
                            lineChart.data.datasets[0].data.push(transaction.amount / 100)
                            lineChart.data.datasets[1].data.push(0)
                        } else {
                            lineChart.data.datasets[1].data.push((transaction.amount * -1) / 100)
                            lineChart.data.datasets[0].data.push(0)
                        }

                    //existe label
                    } else {

                        if (transaction.amount > 0) {
                            lineChart.data.datasets[0].data[index] += (transaction.amount / 100)
                        } else {
                            lineChart.data.datasets[1].data[index] += ((transaction.amount * -1) / 100)
                        }
                        
                    }

                }
            })
        })

        lineChart.update()

    }
}

const Theme = {
    html: document.querySelector('html'),
    checkbox: document.querySelector('#theme-selector'),

    setTheme() {
        if(this.get() == "enabled") {
            this.html.classList.add('omni-theme')
            this.checkbox.classList.add('checked')
            lineChart.options.title.fontColor = "#ffffff"
            lineChart.options.legend.labels.fontColor = "#ffffff"
        } else {
            this.html.classList.remove('omni-theme')
            this.checkbox.classList.remove('checked')
            lineChart.options.title.fontColor = "#363f5f"
            lineChart.options.legend.labels.fontColor = "#363f5f"
        }
    },

    changeTheme() {

        if(this.html.classList[0] == "omni-theme") {
            this.html.classList.remove('omni-theme')
            this.checkbox.classList.remove('checked')
            this.set("disabled") 
            lineChart.options.title.fontColor = "#363f5f"
            lineChart.options.legend.labels.fontColor = "#363f5f"
        } else {
            this.html.classList.add('omni-theme')
            this.checkbox.classList.add('checked')
            this.set("enabled")
            lineChart.options.title.fontColor = "#ffffff"
            lineChart.options.legend.labels.fontColor = "#ffffff"
        }

        lineChart.update(0)
    },

    get() {
        return localStorage.getItem('omni-theme') || "disabled"
    },

    set(value) {
        localStorage.setItem('omni-theme', String(value))
    }
    
}

const App = {
    init() {

        Theme.setTheme()

        Transaction.all.forEach((transaction, index) => {
            DOM.addTransaction(transaction, index)
        })

        DOM.updateBalance()


        Graphics.updateDatas()

        Storage.set(Transaction.all)

    },

    reload() {
        DOM.clearTransactions()
        this.init()
    }
}

let lineChart = new Chart(Graphics.ctx, Graphics.optionsChart)
App.init()
