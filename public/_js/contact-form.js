emailjs.init({
  publicKey: "Ee4jJVL8vOD7-lylO",
});
window.onload = function() {
    document.getElementById('contact-form-btn').addEventListener('click', function(event) {
        event.preventDefault();
        // these IDs from the previous steps
        let statusMsg = document.getElementById("status-msg");
        statusMsg.innerHTML = '<label><img src="../_static/loading.gif"> Please wait</label>'
        const msgParams = {
          "sender": document.getElementById("email-field").value,
          "message": document.getElementById("message-field").value
        }
        emailjs.send('service_ypn4mwg', 'template_ln88zmi', msgParams)
            .then((response) => {
                console.log('SUCCESS!', response.status, response.text);
                statusMsg.innerHTML = '<label><img src="../_static/success.png"> Submitted</label>'
            }, (error) => {
                console.log('FAILED...', error);
            });
    });
}
