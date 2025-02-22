document.getElementById('showFormButton').addEventListener('click', function() {
    const formContainer = document.getElementById('requestFormContainer');
    formContainer.classList.add('slide-down'); // Add the "visible" class to trigger the transition
    this.style.display = 'none'; // Hide the button
});

document.getElementById('requestForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const email = localStorage.getItem('email');
    const name = document.getElementById('name').value.trim();
    const contactInformation = document.getElementById('contact').value.trim();
    const requestType = document.getElementById('requestType').value.trim().toLowerCase(); // Trim and lower case
    const description = document.getElementById('description').value.trim();
    const quantity = parseInt(document.getElementById('quantity').value);
    const location = document.getElementById('location').value.trim();

    // Log values to debug
    console.log(`Request Type: ${requestType}, Quantity: ${quantity}`);

    // Create the request object
    const requestData = {
        name,
        contactInformation,
        requestType,
        description,
        quantity,
        location,
        email,
    };

    // Log the requestData object
    console.log("Request Data:", requestData);

    // Make API call to submit the request
    try {
        const response = await fetch('/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
        });

        const result = await response.json();

        if (response.ok) {
            document.getElementById('message').innerText = `Request submitted successfully! You requested ${quantity} ${requestType}.`;
        } else {
            document.getElementById('message').innerText = `Error: ${result.message}`;
        }
    } catch (error) {
        document.getElementById('message').innerText = `Error: ${error.message}`;
    }

    document.getElementById('requestForm').reset();
});

document.getElementById('redirectButton').addEventListener('click', function() {
    const formContainer = document.getElementById('requestFormContainer');
    formContainer.style.display = 'block'; 
    formContainer.classList.add('slide-down');
    this.style.display = 'none'; 
});
