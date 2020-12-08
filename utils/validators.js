const isEmpty = (string) => {
    if(string.trim() === '') return true;
    else return false;
}

exports.validateProductData = (data) => {
    let errors = {};
    if(isEmpty(data.name)) errors.name = 'Must not be empty';
    return{
        errors, 
        valid: Object.keys(errors).length === 0 ? true : false 
    }
};
