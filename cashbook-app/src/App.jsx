import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog.jsx'
import { Plus, ArrowLeft, FileText, Filter, Calendar, Users, Trash2, Edit, MoreVertical } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu.jsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState("books"); // "books", "book-detail", "loan-books", "loan-book-detail"
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [newBookName, setNewBookName] = useState("");
  const [filters, setFilters] = useState({
    dateRange: "all",
    entryType: "all",
    searchTerm: "",
  });
  const [newTransaction, setNewTransaction] = useState({
    type: "cash-in",
    amount: "",
    description: "",
    contact: "",
    category: "Cash",
  });

  // Loan management state
  const [loanBooks, setLoanBooks] = useState([]);
  const [selectedLoanBook, setSelectedLoanBook] = useState(null);
  const [loanTransactions, setLoanTransactions] = useState([]);
  const [isAddLoanBookOpen, setIsAddLoanBookOpen] = useState(false);
  const [isAddLoanTransactionOpen, setIsAddLoanTransactionOpen] = useState(false);
  const [isEditLoanTransactionOpen, setIsEditLoanTransactionOpen] = useState(false);
  const [editingLoanTransaction, setEditingLoanTransaction] = useState(null);
  const [newLoanBookName, setNewLoanBookName] = useState("");
  const [newLoanTransaction, setNewLoanTransaction] = useState({
    type: "loan-given",
    amount: "",
    description: "",
    contact: "",
    dueDate: "",
    reminder: "none",
  });

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedBooks = localStorage.getItem('cashbook-books')
    const savedTransactions = localStorage.getItem('cashbook-transactions')
    const savedLoanBooks = localStorage.getItem("cashbook-loan-books");
    const savedLoanTransactions = localStorage.getItem("cashbook-loan-transactions");
    
    if (savedBooks) {
      setBooks(JSON.parse(savedBooks))
    }
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions))
    }
    if (savedLoanBooks) {
      setLoanBooks(JSON.parse(savedLoanBooks));
    }
    if (savedLoanTransactions) {
      setLoanTransactions(JSON.parse(savedLoanTransactions));
    }
  }, [])

  // Save books to localStorage whenever books change
  useEffect(() => {
    localStorage.setItem('cashbook-books', JSON.stringify(books))
  }, [books])

  // Save transactions to localStorage whenever transactions change
  useEffect(() => {
    localStorage.setItem("cashbook-transactions", JSON.stringify(transactions));
  }, [transactions]);

  // Save loan books to localStorage whenever loanBooks change
  useEffect(() => {
    localStorage.setItem("cashbook-loan-books", JSON.stringify(loanBooks));
  }, [loanBooks]);

  // Save loan transactions to localStorage whenever loanTransactions change
  useEffect(() => {
    localStorage.setItem("cashbook-loan-transactions", JSON.stringify(loanTransactions));
  }, [loanTransactions]);

  // Filter transactions when filters or transactions change
  useEffect(() => {
    if (selectedBook) {
      let filtered = getBookTransactions(selectedBook.id)
      
      // Apply entry type filter
      if (filters.entryType !== 'all') {
        filtered = filtered.filter(t => t.type === filters.entryType)
      }
      
      // Apply date range filter
      if (filters.dateRange !== 'all') {
        const now = new Date()
        const filterDate = new Date()
        
        switch (filters.dateRange) {
          case 'today':
            filterDate.setHours(0, 0, 0, 0)
            filtered = filtered.filter(t => new Date(t.date) >= filterDate)
            break
          case 'week':
            filterDate.setDate(now.getDate() - 7)
            filtered = filtered.filter(t => new Date(t.date) >= filterDate)
            break
          case 'month':
            filterDate.setMonth(now.getMonth() - 1)
            filtered = filtered.filter(t => new Date(t.date) >= filterDate)
            break
        }
      }
      
      // Apply search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase()
        filtered = filtered.filter(t => 
          t.description.toLowerCase().includes(searchLower) ||
          t.contact.toLowerCase().includes(searchLower) ||
          t.category.toLowerCase().includes(searchLower)
        )
      }
      
      setFilteredTransactions(filtered)
    }
  }, [transactions, filters, selectedBook])

  // Cash book functions
  const addBook = () => {
    if (newBookName.trim()) {
      const newBook = {
        id: Date.now().toString(),
        name: newBookName.trim(),
        createdAt: new Date().toISOString()
      }
      setBooks([...books, newBook])
      setNewBookName('')
      setIsAddBookOpen(false)
    }
  }

  const deleteBook = (bookId) => {
    setBooks(books.filter(book => book.id !== bookId))
    setTransactions(transactions.filter(t => t.bookId !== bookId))
    if (selectedBook && selectedBook.id === bookId) {
      setCurrentView('books')
      setSelectedBook(null)
    }
  }

  const openBook = (book) => {
    setSelectedBook(book)
    setCurrentView('book-detail')
  }

  const addTransaction = () => {
    if (newTransaction.amount && newTransaction.description) {
      const transaction = {
        id: Date.now().toString(),
        bookId: selectedBook.id,
        type: newTransaction.type,
        amount: parseFloat(newTransaction.amount),
        description: newTransaction.description.trim(),
        contact: newTransaction.contact.trim(),
        category: newTransaction.category,
        date: new Date().toISOString(),
        createdBy: 'User'
      }
      setTransactions([...transactions, transaction])
      setNewTransaction({
        type: 'cash-in',
        amount: '',
        description: '',
        contact: '',
        category: 'Cash'
      })
      setIsAddTransactionOpen(false)
    }
  }

  const editTransaction = () => {
    if (editingTransaction && editingTransaction.amount && editingTransaction.description) {
      const updatedTransactions = transactions.map(t => 
        t.id === editingTransaction.id 
          ? {
              ...editingTransaction,
              amount: parseFloat(editingTransaction.amount),
              description: editingTransaction.description.trim(),
              contact: editingTransaction.contact.trim()
            }
          : t
      )
      setTransactions(updatedTransactions)
      setEditingTransaction(null)
      setIsEditTransactionOpen(false)
    }
  }

  const deleteTransaction = (transactionId) => {
    setTransactions(transactions.filter(t => t.id !== transactionId))
  }

  const openEditTransaction = (transaction) => {
    setEditingTransaction({...transaction})
    setIsEditTransactionOpen(true)
  }

  const getBookTransactions = (bookId) => {
    return transactions.filter(t => t.bookId === bookId).sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  const calculateBookStats = (bookId) => {
    const bookTransactions = getBookTransactions(bookId)
    const totalIn = bookTransactions
      .filter(t => t.type === 'cash-in')
      .reduce((sum, t) => sum + t.amount, 0)
    const totalOut = bookTransactions
      .filter(t => t.type === 'cash-out')
      .reduce((sum, t) => sum + t.amount, 0)
    const netBalance = totalIn - totalOut
    
    return { totalIn, totalOut, netBalance }
  }

  // Loan book functions
  const addLoanBook = () => {
    if (newLoanBookName.trim()) {
      const newLoanBook = {
        id: Date.now().toString(),
        name: newLoanBookName.trim(),
        createdAt: new Date().toISOString(),
      };
      setLoanBooks([...loanBooks, newLoanBook]);
      setNewLoanBookName("");
      setIsAddLoanBookOpen(false);
    }
  };

  const deleteLoanBook = (loanBookId) => {
    setLoanBooks(loanBooks.filter((book) => book.id !== loanBookId));
    setLoanTransactions(loanTransactions.filter((t) => t.loanBookId !== loanBookId));
    if (selectedLoanBook && selectedLoanBook.id === loanBookId) {
      setCurrentView("loan-books");
      setSelectedLoanBook(null);
    }
  };

  const openLoanBook = (loanBook) => {
    setSelectedLoanBook(loanBook);
    setCurrentView("loan-book-detail");
  };

  const addLoanTransaction = () => {
    if (newLoanTransaction.amount && newLoanTransaction.description) {
      const transaction = {
        id: Date.now().toString(),
        loanBookId: selectedLoanBook.id,
        type: newLoanTransaction.type,
        amount: parseFloat(newLoanTransaction.amount),
        description: newLoanTransaction.description.trim(),
        contact: newLoanTransaction.contact.trim(),
        dueDate: newLoanTransaction.dueDate,
        reminder: newLoanTransaction.reminder,
        date: new Date().toISOString(),
        createdBy: "User",
      };
      setLoanTransactions([...loanTransactions, transaction]);
      setNewLoanTransaction({
        type: "loan-given",
        amount: "",
        description: "",
        contact: "",
        dueDate: "",
        reminder: "none",
      });
      setIsAddLoanTransactionOpen(false);

      // Schedule reminder if selected
      if (newLoanTransaction.reminder !== "none") {
        scheduleReminder(transaction);
      }
    }
  };

  const editLoanTransaction = () => {
    if (editingLoanTransaction && editingLoanTransaction.amount && editingLoanTransaction.description) {
      const updatedLoanTransactions = loanTransactions.map((t) =>
        t.id === editingLoanTransaction.id
          ? {
              ...editingLoanTransaction,
              amount: parseFloat(editingLoanTransaction.amount),
              description: editingLoanTransaction.description.trim(),
              contact: editingLoanTransaction.contact.trim(),
            }
          : t
      );
      setLoanTransactions(updatedLoanTransactions);
      setEditingLoanTransaction(null);
      setIsEditLoanTransactionOpen(false);
    }
  };

  const deleteLoanTransaction = (transactionId) => {
    setLoanTransactions(loanTransactions.filter((t) => t.id !== transactionId));
  };

  const openEditLoanTransaction = (transaction) => {
    setEditingLoanTransaction({ ...transaction });
    setIsEditLoanTransactionOpen(true);
  };

  const getLoanBookTransactions = (loanBookId) => {
    return loanTransactions.filter((t) => t.loanBookId === loanBookId).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const calculateLoanBookStats = (loanBookId) => {
    const bookTransactions = getLoanBookTransactions(loanBookId);
    const totalGiven = bookTransactions
      .filter((t) => t.type === "loan-given")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalTaken = bookTransactions
      .filter((t) => t.type === "loan-taken")
      .reduce((sum, t) => sum + t.amount, 0);
    const netBalance = totalGiven - totalTaken;

    return { totalGiven, totalTaken, netBalance };
  };

  // Reminder function
  const scheduleReminder = (transaction) => {
    const reminderTime = {
      "1min": 1 * 60 * 1000,
      "1week": 7 * 24 * 60 * 60 * 1000,
      "halfmonth": 15 * 24 * 60 * 60 * 1000,
      "1month": 30 * 24 * 60 * 60 * 1000,
      "6month": 180 * 24 * 60 * 60 * 1000,
      "1year": 365 * 24 * 60 * 60 * 1000,
    };

    const delay = reminderTime[transaction.reminder];
    if (delay) {
      setTimeout(() => {
        if (Notification.permission === "granted") {
          new Notification("Loan Reminder", {
            body: `Reminder for ${transaction.type === "loan-given" ? "loan given to" : "loan taken from"} ${transaction.contact || "contact"}: ${transaction.description}`,
            icon: "/favicon.ico"
          });
        }
      }, delay);
    }
  };

  // Request notification permission on component mount
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          console.log("Notification permission granted.");
        } else if (permission === "denied") {
          console.log("Notification permission denied.");
        }
      });
    }
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const importDataFromJson = (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.books && data.transactions && data.loanBooks && data.loanTransactions) {
          setBooks(data.books);
          setTransactions(data.transactions);
          setLoanBooks(data.loanBooks);
          setLoanTransactions(data.loanTransactions);
          alert("Data imported successfully!");
        } else {
          alert("Invalid JSON file format.");
        }
      } catch (error) {
        alert("Error parsing JSON file: " + error.message);
      }
    };
    reader.readAsText(file);
  };

  const exportDataToJson = () => {
    const data = {
      books,
      transactions,
      loanBooks,
      loanTransactions,
    };
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "cashbook_data.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importTransactionsFromCsv = (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split("\n").filter(line => line.trim() !== "");
      if (lines.length <= 1) {
        alert("CSV file is empty or only contains headers.");
        return;
      }

      const headers = lines[0].split(",").map(h => h.replace(/"/g, "").trim().toLowerCase());
      const requiredHeaders = ["type", "amount", "description", "contact", "category", "date", "created by"];
      const missingHeaders = requiredHeaders.filter(rh => !headers.includes(rh));

      if (missingHeaders.length > 0) {
        alert(`Missing required CSV headers: ${missingHeaders.join(", ")}. Please ensure your CSV has columns for Type, Amount, Description, Contact, Category, Date, and Created By.`);
        return;
      }

      const newTransactions = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.replace(/"/g, "").trim());
        const transaction = {};
        headers.forEach((header, index) => {
          transaction[header.replace(/\./g, "")] = values[index];
        });

        // Basic validation and type conversion
        const type = transaction.type.toLowerCase();
        const amount = parseFloat(transaction.amount);
        const description = transaction.description;
        const contact = transaction.contact || "";
        const category = transaction.category || "Other";
        const date = new Date(transaction.date).toISOString();
        const createdBy = transaction.createdby || "Imported";

        if (!["cash-in", "cash-out"].includes(type) || isNaN(amount) || !description) {
          console.warn(`Skipping invalid row: ${lines[i]}`);
          continue;
        }

        newTransactions.push({
          id: Date.now().toString() + i, // Unique ID for each imported transaction
          bookId: selectedBook.id,
          type,
          amount,
          description,
          contact,
          category,
          date,
          createdBy,
        });
      }

      if (newTransactions.length > 0) {
        setTransactions(prevTransactions => [...prevTransactions, ...newTransactions]);
        alert(`Successfully imported ${newTransactions.length} transactions.`);
      } else {
        alert("No valid transactions found in the CSV file.");
      }
    };
    reader.readAsText(file);
  };

  const exportTransactionsToCsv = (bookId) => {
    const bookTransactions = getBookTransactions(bookId);
    if (bookTransactions.length === 0) {
      alert("No transactions to export.");
      return;
    }

    const headers = ["ID", "Type", "Amount", "Description", "Contact", "Category", "Date", "Created By"];
    const rows = bookTransactions.map(t => [
      t.id,
      t.type,
      t.amount,
      t.description,
      t.contact,
      t.category,
      new Date(t.date).toLocaleString(),
      t.createdBy
    ]);

    let csvContent = headers.join(",") + "\n";
    rows.forEach(row => {
      csvContent += row.map(item => `"${item}"`).join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `${selectedBook.name.replace(/[^a-zA-Z0-9]/g, ".")}_transactions.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePDFReport = async () => {
    try {
      // Show loading message
      const loadingAlert = document.createElement('div')
      loadingAlert.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000; text-align: center; font-family: Arial, sans-serif;
      `
      loadingAlert.innerHTML = '<div>Generating PDF...</div>'
      document.body.appendChild(loadingAlert)

      // Small delay to show loading message
      await new Promise(resolve => setTimeout(resolve, 100))

      const bookTransactions = filteredTransactions.length > 0 ? filteredTransactions : getBookTransactions(selectedBook.id)
      const stats = calculateBookStats(selectedBook.id)
      
      // Create PDF with better mobile compatibility
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      // Set font
      doc.setFont('helvetica')
      
      // Header
      doc.setFontSize(18)
      doc.setTextColor(0, 0, 0)
      doc.text('CashBook Report', 20, 20)
      
      // Book info
      doc.setFontSize(12)
      doc.text(`Book: ${selectedBook.name}`, 20, 35)
      doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-US', { hour12: true })}`, 20, 45)
      
      // Summary section
      doc.setFontSize(14)
      doc.setTextColor(0, 0, 0)
      doc.text('Summary', 20, 65)
      
      doc.setFontSize(11)
      doc.text(`Net Balance: ${formatCurrency(stats.netBalance)}`, 25, 75)
      doc.text(`Total In (+): ${formatCurrency(stats.totalIn)}`, 25, 85)
      doc.text(`Total Out (-): ${formatCurrency(stats.totalOut)}`, 25, 95)
      doc.text(`Total Entries: ${bookTransactions.length}`, 25, 105)
      
      // Transactions section
      if (bookTransactions.length > 0) {
        doc.setFontSize(14)
        doc.text('Transactions', 20, 125)
        
        // Prepare table data with better formatting
        const tableData = bookTransactions.map((transaction, index) => {
          const date = new Date(transaction.date)
          return [
            (index + 1).toString(),
            date.toLocaleDateString('en-GB'),
            date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
            transaction.type === 'cash-in' ? 'In' : 'Out',
            transaction.contact || 'Cash',
            transaction.description.length > 30 ? transaction.description.substring(0, 30) + '...' : transaction.description,
            `${transaction.type === 'cash-in' ? '+' : '-'}${formatCurrency(transaction.amount)}`
          ]
        })
        
        // Create table with better mobile-friendly settings
        autoTable(doc, {
          head: [['#', 'Date', 'Time', 'Type', 'Contact', 'Description', 'Amount']],
          body: tableData,
          startY: 135,
          styles: { 
            fontSize: 8,
            cellPadding: 2,
            overflow: 'linebreak',
            halign: 'left'
          },
          headStyles: { 
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 25 },
            2: { cellWidth: 20 },
            3: { cellWidth: 15, halign: 'center' },
            4: { cellWidth: 25 },
            5: { cellWidth: 40 },
            6: { cellWidth: 25, halign: 'right' }
          },
          margin: { left: 15, right: 15 },
          theme: 'striped',
          alternateRowStyles: { fillColor: [245, 245, 245] }
        })
      } else {
        doc.setFontSize(12)
        doc.text('No transactions found.', 20, 135)
      }
      
      // Footer
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.text(`Page ${i} of ${pageCount}`, 20, 285)
        doc.text('Generated by CashBook by Qbexel', 120, 285)
      }
      
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `${selectedBook.name.replace(/[^a-zA-Z0-9]/g, '_')}_Report_${timestamp}.pdf`
      
      // Remove loading message
      document.body.removeChild(loadingAlert)
      
      // Save PDF with better error handling
      try {
        doc.save(filename)
        
        // Show success message
        const successAlert = document.createElement('div')
        successAlert.style.cssText = `
          position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
          background: #10b981; color: white; padding: 12px 24px; border-radius: 6px;
          z-index: 10000; font-family: Arial, sans-serif; font-size: 14px;
        `
        successAlert.innerHTML = '✓ PDF downloaded successfully!'
        document.body.appendChild(successAlert)
        
        setTimeout(() => {
          if (document.body.contains(successAlert)) {
            document.body.removeChild(successAlert)
          }
        }, 3000)
        
      } catch (saveError) {
        console.error('PDF save error:', saveError)
        throw new Error('Failed to save PDF file')
      }
      
    } catch (error) {
      console.error('PDF generation error:', error)
      
      // Remove loading message if it exists
      const loadingAlert = document.querySelector('div[style*="Generating PDF"]')
      if (loadingAlert) {
        document.body.removeChild(loadingAlert)
      }
      
      // Show error message
      const errorAlert = document.createElement('div')
      errorAlert.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        background: #ef4444; color: white; padding: 12px 24px; border-radius: 6px;
        z-index: 10000; font-family: Arial, sans-serif; font-size: 14px;
      `
      errorAlert.innerHTML = '✗ PDF generation failed. Please try again.'
      document.body.appendChild(errorAlert)
      
      setTimeout(() => {
        if (document.body.contains(errorAlert)) {
          document.body.removeChild(errorAlert)
        }
      }, 5000)
    }
  }

  const clearFilters = () => {
    setFilters({
      dateRange: 'all',
      entryType: 'all',
      searchTerm: ''
    })
  }

  // Books view
  if (currentView === "books") {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img src="/1000270518.png" alt="CashBook Logo" className="h-10" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">CashBook by Qbexel</h1>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Books List */}
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">Your Books</h2>
          </div>

          <div className="space-y-4">
            {books.map((book) => {
              const stats = calculateBookStats(book.id)
              return (
                <Card key={book.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3" onClick={() => openBook(book)}>
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{book.name}</h3>
                          <p className="text-sm text-gray-500">
                            {getBookTransactions(book.id).length} entries • Updated just now
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">{formatCurrency(stats.netBalance)}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => openBook(book)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Open Book
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Book
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Book</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{book.name}"? This will also delete all transactions in this book. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteBook(book.id)} className="bg-red-600 hover:bg-red-700">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Add New Book Button */}
          <Dialog open={isAddBookOpen} onOpenChange={setIsAddBookOpen}>
            <DialogTrigger asChild>
              <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-full">
                <Plus className="h-5 w-5 mr-2" />
                ADD NEW BOOK
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm mx-auto">
              <DialogHeader>
                <DialogTitle>Create New Book</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bookName">Book Name</Label>
                  <Input
                    id="bookName"
                    value={newBookName}
                    onChange={(e) => setNewBookName(e.target.value)}
                    placeholder="Enter book name"
                    className="mt-1"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" className="flex-1" onClick={() => setIsAddBookOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={addBook}>
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t">
          <div className="max-w-md mx-auto px-4 py-2">
            <div className="flex justify-around">
              <Button variant="ghost" className="flex-1 py-3 text-blue-600" onClick={() => setCurrentView("books")}>
                <FileText className="h-5 w-5 mb-1" />
                <span className="text-xs">Cashbooks</span>
              </Button>
              <Button variant="ghost" className="flex-1 py-3" onClick={() => setCurrentView("loan-books")}>
                <Users className="h-5 w-5 mb-1" />
                <span className="text-xs">Loans</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Loan books view
  if (currentView === "loan-books") {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">L</span>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Loan Books</h1>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loan Books List */}
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">Your Loan Books</h2>
          </div>

          <div className="space-y-4">
          </div>

          <div className="space-y-4">
            {loanBooks.map((loanBook) => {
              const stats = calculateLoanBookStats(loanBook.id);
              return (
                <Card key={loanBook.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3" onClick={() => openLoanBook(loanBook)}>
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{loanBook.name}</h3>
                          <p className="text-sm text-gray-500">
                            {getLoanBookTransactions(loanBook.id).length} entries • Updated just now
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">{formatCurrency(stats.netBalance)}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => openLoanBook(loanBook)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Open Loan Book
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Loan Book
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Loan Book</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{loanBook.name}"? This will also delete all transactions in this book. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteLoanBook(loanBook.id)} className="bg-red-600 hover:bg-red-700">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Add New Loan Book Button */}
          <Dialog open={isAddLoanBookOpen} onOpenChange={setIsAddLoanBookOpen}>
            <DialogTrigger asChild>
              <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-full">
                <Plus className="h-5 w-5 mr-2" />
                ADD NEW LOAN BOOK
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm mx-auto">
              <DialogHeader>
                <DialogTitle>Create New Loan Book</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="loanBookName">Loan Book Name</Label>
                  <Input
                    id="loanBookName"
                    value={newLoanBookName}
                    onChange={(e) => setNewLoanBookName(e.target.value)}
                    placeholder="Enter loan book name"
                    className="mt-1"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" className="flex-1" onClick={() => setIsAddLoanBookOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={addLoanBook}>
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t">
          <div className="max-w-md mx-auto px-4 py-2">
            <div className="flex justify-around">
              <Button variant="ghost" className="flex-1 py-3" onClick={() => setCurrentView("books")}>
                <FileText className="h-5 w-5 mb-1" />
                <span className="text-xs">Cashbooks</span>
              </Button>
              <Button variant="ghost" className="flex-1 py-3 text-blue-600" onClick={() => setCurrentView("loan-books")}>
                <Users className="h-5 w-5 mb-1" />
                <span className="text-xs">Loans</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loan book detail view
  if (currentView === "loan-book-detail") {
    const loanBookStats = calculateLoanBookStats(selectedLoanBook.id);
    const displayLoanTransactions = getLoanBookTransactions(selectedLoanBook.id);

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="icon" onClick={() => setCurrentView("loan-books")}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">{selectedLoanBook.name}</h1>
                  <p className="text-sm text-gray-500">Loan Details</p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <Users className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Loan Stats Card */}
        <div className="max-w-md mx-auto px-4 mb-6 mt-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Net Loan Balance</span>
                  <span className="text-2xl font-bold text-gray-900">{formatCurrency(loanBookStats.netBalance)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Given (+)</span>
                  <span className="text-lg font-semibold text-green-600">{formatCurrency(loanBookStats.totalGiven)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Taken (-)</span>
                  <span className="text-lg font-semibold text-red-600">{formatCurrency(loanBookStats.totalTaken)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loan Transactions List */}
        <div className="max-w-md mx-auto px-4 pb-24">
          <p className="text-center text-gray-500 mb-4">Showing {displayLoanTransactions.length} entries</p>

          {displayLoanTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No loan transactions found</p>
              <p className="text-sm text-gray-400">Add your first loan transaction below</p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayLoanTransactions.map((transaction) => (
                <Card key={transaction.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openEditLoanTransaction(transaction)}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-gray-900">{transaction.contact || "N/A"}</h3>
                        </div>
                        <p className="text-sm text-blue-600 mb-1">{transaction.description}</p>
                        <p className="text-xs text-gray-500">Due: {transaction.dueDate || "N/A"}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          Entry by {transaction.createdBy} at {formatTime(transaction.date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-semibold ${transaction.type === "loan-given" ? "text-green-600" : "text-red-600"}`}>
                          {transaction.type === "loan-given" ? "+" : "-"}{formatCurrency(transaction.amount)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Add Loan Transaction Buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t">
          <div className="max-w-md mx-auto p-4">
            <div className="flex space-x-2">
              <Dialog open={isAddLoanTransactionOpen} onOpenChange={setIsAddLoanTransactionOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3"
                    onClick={() => setNewLoanTransaction({ ...newLoanTransaction, type: "loan-given" })}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    LOAN GIVEN
                  </Button>
                </DialogTrigger>
                <DialogTrigger asChild>
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3"
                    onClick={() => setNewLoanTransaction({ ...newLoanTransaction, type: "loan-taken" })}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    LOAN TAKEN
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm mx-auto">
                  <DialogHeader>
                    <DialogTitle>
                      Add {newLoanTransaction.type === "loan-given" ? "Loan Given" : "Loan Taken"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="loanAmount">Amount</Label>
                      <Input
                        id="loanAmount"
                        type="number"
                        value={newLoanTransaction.amount}
                        onChange={(e) => setNewLoanTransaction({ ...newLoanTransaction, amount: e.target.value })}
                        placeholder="Enter amount"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="loanDescription">Description</Label>
                      <Textarea
                        id="loanDescription"
                        value={newLoanTransaction.description}
                        onChange={(e) => setNewLoanTransaction({ ...newLoanTransaction, description: e.target.value })}
                        placeholder="Enter description"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="loanContact">Contact (Optional)</Label>
                      <Input
                        id="loanContact"
                        value={newLoanTransaction.contact}
                        onChange={(e) => setNewLoanTransaction({ ...newLoanTransaction, contact: e.target.value })}
                        placeholder="Enter contact name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dueDate">Due Date (Optional)</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={newLoanTransaction.dueDate}
                        onChange={(e) => setNewLoanTransaction({ ...newLoanTransaction, dueDate: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="reminder">Reminder</Label>
                      <Select value={newLoanTransaction.reminder} onValueChange={(value) => setNewLoanTransaction({ ...newLoanTransaction, reminder: value })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="1min">1 Minute</SelectItem>
                          <SelectItem value="1week">1 Week</SelectItem>
                          <SelectItem value="halfmonth">Half Month</SelectItem>
                          <SelectItem value="1month">1 Month</SelectItem>
                          <SelectItem value="6month">6 Months</SelectItem>
                          <SelectItem value="1year">1 Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" className="flex-1" onClick={() => setIsAddLoanTransactionOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        className={`flex-1 ${newLoanTransaction.type === "loan-given" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                        onClick={addLoanTransaction}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Edit Loan Transaction Dialog */}
        <Dialog open={isEditLoanTransactionOpen} onOpenChange={setIsEditLoanTransactionOpen}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle>
                Edit {editingLoanTransaction?.type === "loan-given" ? "Loan Given" : "Loan Taken"}
              </DialogTitle>
            </DialogHeader>
            {editingLoanTransaction && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editLoanAmount">Amount</Label>
                  <Input
                    id="editLoanAmount"
                    type="number"
                    value={editingLoanTransaction.amount}
                    onChange={(e) => setEditingLoanTransaction({ ...editingLoanTransaction, amount: e.target.value })}
                    placeholder="Enter amount"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="editLoanDescription">Description</Label>
                  <Textarea
                    id="editLoanDescription"
                    value={editingLoanTransaction.description}
                    onChange={(e) => setEditingLoanTransaction({ ...editingLoanTransaction, description: e.target.value })}
                    placeholder="Enter description"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="editLoanContact">Contact (Optional)</Label>
                  <Input
                    id="editLoanContact"
                    value={editingLoanTransaction.contact}
                    onChange={(e) => setEditingLoanTransaction({ ...editingLoanTransaction, contact: e.target.value })}
                    placeholder="Enter contact name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="editDueDate">Due Date (Optional)</Label>
                  <Input
                    id="editDueDate"
                    type="date"
                    value={editingLoanTransaction.dueDate}
                    onChange={(e) => setEditingLoanTransaction({ ...editingLoanTransaction, dueDate: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="flex space-x-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="flex-1 text-red-600 border-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Loan Transaction</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this loan transaction? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            deleteLoanTransaction(editingLoanTransaction.id);
                            setIsEditLoanTransactionOpen(false);
                            setEditingLoanTransaction(null);
                          }}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button variant="outline" className="flex-1" onClick={() => setIsEditLoanTransactionOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    className={`flex-1 ${editingLoanTransaction.type === "loan-given" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                    onClick={editLoanTransaction}
                  >
                    Save
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Book Detail View
  const bookStats = calculateBookStats(selectedBook.id)
  const displayTransactions = filteredTransactions.length > 0 || filters.dateRange !== 'all' || filters.entryType !== 'all' || filters.searchTerm 
    ? filteredTransactions 
    : getBookTransactions(selectedBook.id)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="icon" onClick={() => setCurrentView('books')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{selectedBook.name}</h1>
                <p className="text-sm text-gray-500">You, User</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear
            </Button>
            <Button variant="outline" size="sm" onClick={() => document.getElementById("jsonFileInput").click()}>
              JSON Import
            </Button>
            <input type="file" id="jsonFileInput" accept=".json" style={{ display: "none" }} onChange={importDataFromJson} />
            <Button variant="outline" size="sm" onClick={exportDataToJson}>
              JSON Export
            </Button>
          <Select value={filters.dateRange} onValueChange={(value) => setFilters({...filters, dateRange: value})}>
            <SelectTrigger className="w-auto">
              <Calendar className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.entryType} onValueChange={(value) => setFilters({...filters, entryType: value})}>
            <SelectTrigger className="w-auto">
              <SelectValue placeholder="Entry Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="cash-in">Cash In</SelectItem>
              <SelectItem value="cash-out">Cash Out</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Input
          placeholder="Search transactions..."
          value={filters.searchTerm}
          onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
          className="mb-4"
        />

      </div>

      {/* Stats Card */}
      <div className="max-w-md mx-auto px-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Net Balance</span>
                <span className="text-2xl font-bold text-gray-900">{formatCurrency(bookStats.netBalance)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total In (+)</span>
                <span className="text-lg font-semibold text-green-600">{formatCurrency(bookStats.totalIn)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Out (-)</span>
                <span className="text-lg font-semibold text-red-600">{formatCurrency(bookStats.totalOut)}</span>
              </div>
            </div>


            <Button variant="link" className="w-full mt-3 text-blue-600" onClick={generatePDFReport}>
              VIEW REPORTS →
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <div className="max-w-md mx-auto px-4 pb-24">
        <p className="text-center text-gray-500 mb-4">Showing {displayTransactions.length} entries</p>
        
        {displayTransactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No transactions found</p>
            <p className="text-sm text-gray-400">
              {filters.dateRange !== 'all' || filters.entryType !== 'all' || filters.searchTerm 
                ? 'Try adjusting your filters' 
                : 'Add your first transaction below'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayTransactions.map((transaction) => (
              <Card key={transaction.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openEditTransaction(transaction)}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-gray-900">{transaction.contact || 'Cash'}</h3>
                        <span className="text-xs text-gray-500">({transaction.category})</span>
                      </div>
                      <p className="text-sm text-blue-600 mb-1">{transaction.description}</p>
                      <p className="text-xs text-gray-500">{transaction.category}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        Entry by {transaction.createdBy} at {formatTime(transaction.date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${transaction.type === 'cash-in' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'cash-in' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Balance: {formatCurrency(bookStats.netBalance)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Transaction Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="max-w-md mx-auto p-4">
          <div className="flex space-x-2">
            <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3"
                  onClick={() => setNewTransaction({...newTransaction, type: 'cash-in'})}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  CASH IN
                </Button>
              </DialogTrigger>
              <DialogTrigger asChild>
                <Button 
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3"
                  onClick={() => setNewTransaction({...newTransaction, type: 'cash-out'})}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  CASH OUT
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm mx-auto">
                <DialogHeader>
                  <DialogTitle>
                    Add {newTransaction.type === 'cash-in' ? 'Cash In' : 'Cash Out'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                      placeholder="Enter amount"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                      placeholder="Enter description"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact">Contact (Optional)</Label>
                    <Input
                      id="contact"
                      value={newTransaction.contact}
                      onChange={(e) => setNewTransaction({...newTransaction, contact: e.target.value})}
                      placeholder="Enter contact name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={newTransaction.category} onValueChange={(value) => setNewTransaction({...newTransaction, category: value})}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Bank">Bank</SelectItem>
                        <SelectItem value="Digital">Digital</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" className="flex-1" onClick={() => setIsAddTransactionOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      className={`flex-1 ${newTransaction.type === 'cash-in' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                      onClick={addTransaction}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Edit Transaction Dialog */}
      <Dialog open={isEditTransactionOpen} onOpenChange={setIsEditTransactionOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>
              Edit {editingTransaction?.type === 'cash-in' ? 'Cash In' : 'Cash Out'}
            </DialogTitle>
          </DialogHeader>
          {editingTransaction && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editAmount">Amount</Label>
                <Input
                  id="editAmount"
                  type="number"
                  value={editingTransaction.amount}
                  onChange={(e) => setEditingTransaction({...editingTransaction, amount: e.target.value})}
                  placeholder="Enter amount"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  value={editingTransaction.description}
                  onChange={(e) => setEditingTransaction({...editingTransaction, description: e.target.value})}
                  placeholder="Enter description"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="editContact">Contact (Optional)</Label>
                <Input
                  id="editContact"
                  value={editingTransaction.contact}
                  onChange={(e) => setEditingTransaction({...editingTransaction, contact: e.target.value})}
                  placeholder="Enter contact name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="editCategory">Category</Label>
                <Select value={editingTransaction.category} onValueChange={(value) => setEditingTransaction({...editingTransaction, category: value})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Bank">Bank</SelectItem>
                    <SelectItem value="Digital">Digital</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex space-x-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="flex-1 text-red-600 border-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this transaction? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => {
                          deleteTransaction(editingTransaction.id)
                          setIsEditTransactionOpen(false)
                          setEditingTransaction(null)
                        }} 
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button variant="outline" className="flex-1" onClick={() => setIsEditTransactionOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  className={`flex-1 ${editingTransaction.type === 'cash-in' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                  onClick={editTransaction}
                >
                  Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default App

