import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from 'axios'

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

// ✅ Add token to all requests from localStorage
const token = localStorage.getItem('token')
if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {

    const currency = import.meta.env.VITE_CURRENCY;

    const navigate = useNavigate()
    const [user, setUser] = useState(null)
    const [isSeller, setIsSeller] = useState(false)
    const [showUserLogin, setShowUserLogin] = useState(false)
    const [products, setProducts] = useState([])
    const [cartItems, setCartItems] = useState({})
    const [searchQuery, setSearchQuery] = useState('')

    // ✅ Helper function to save token
    const saveToken = (token) => {
        localStorage.setItem('token', token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }

    // ✅ Helper function to remove token
    const removeToken = () => {
        localStorage.removeItem('token')
        delete axios.defaults.headers.common['Authorization']
    }

    // Fetch seller status
    const fetchSeller = async () => {
        try {
            const { data } = await axios.get('/api/seller/is-Auth')
            if (data.success) {
                setIsSeller(true)
            } else {
                setIsSeller(false)
            }
        } catch (error) {
            toast.error(error.message)
            console.log(`error: ${error}`)
        }
    }

    // Fetch user status, user data and cart items

    const fetchUser = async () => {
        try {
            const { data } = await axios.get('/api/user/is-auth')
            if (data.success) {

                setUser(data.user)
                setCartItems(data.user.cartItems)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            setUser(null)
            toast.error(error.message)
            console.log(`error: ${error}`)
        }
    }

    //Fetch all products
    const fetchProducts = async () => {
        try {
            const { data } = await axios.get('/api/product/list')

            if (data.success) {
                setProducts(data.products)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
            console.log(`error: ${error}`)
        }
    }

    // Add Product to Cart
    const addToCart = (itemId) => {
        let cartData = structuredClone(cartItems)

        if (cartData[itemId]) {
            cartData[itemId]++
        } else {
            cartData[itemId] = 1
        }
        setCartItems(cartData)
        toast.success('Added to Cart')

    }

    // Update cart item quantity
    const updateCartItem = (itemId, quantity) => {
        let cartData = structuredClone(cartItems)
        cartData[itemId] = quantity;
        setCartItems(cartData)
        toast.success("Card Updated!")
    }

    // Remove product from card
    const removeFromCart = (itemId) => {
        let cartData = structuredClone(cartItems)
        if (cartData[itemId]) {
            cartData[itemId]--
            if (cartData[itemId] === 0) {
                delete cartData[itemId]
            }
        }
        toast.success('Removed from Cart')
        setCartItems(cartData)
    }

    // get cart item count 
    const getCartCount = () => {
        let totalCount = 0
        for (const item in cartItems) {
            totalCount += cartItems[item];
        }
        return totalCount
    }

    // Get cart total amount
    const getCartAmount = () => {
        let totalAmount = 0;
        for (let item in cartItems) {
            const itemInfo = products.find((product) => product._id === item)
            if (itemInfo && cartItems[item] > 0) {
                totalAmount += itemInfo.offerPrice * cartItems[item]
            }
        }
        return Math.floor(totalAmount * 100) / 100
    }


    // ✅ Load token on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('token')
        if (storedToken) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
            fetchUser()
        }
    }, [])
    
    // Update cart items
    useEffect(() => {
        const updateCart = async () => {
            try {

                const { data } = await axios.post('/api/cart/update', { cartItems: cartItems, userId: user._id ? user._id : "694fc8983d53b0514bbd76c0" })
                if (!data.success) {
                    toast.error(data.message)
                }
            } catch (error) {
                toast.error(error.message)
            }
        }
        if (user) {
            updateCart()
        }
    }, [cartItems])

    useEffect(() => {
        fetchUser()
        fetchSeller()
        fetchProducts()

    }, [])


    const value = {saveToken, removeToken, navigate, user, setUser, isSeller, setIsSeller, showUserLogin, setShowUserLogin, products, currency, addToCart, updateCartItem, removeFromCart, cartItems, setCartItems, searchQuery, setSearchQuery, getCartCount, getCartAmount, axios, fetchProducts }

    return <AppContext.Provider value={value}>
        {children}
    </AppContext.Provider>
}

export const useAppContext = () => {
    return useContext(AppContext)
}
