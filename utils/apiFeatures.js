class ApiFeature {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  filtering() {
    let queryObj = { ...this.queryStr };
    const ignoreAttributes = ['page', 'fields', 'sort', 'limit'];
    ignoreAttributes.forEach((attr) => {
      delete queryObj[attr];
    });
    console.log('req obj filtering before',queryObj)

    queryObj = JSON.stringify(queryObj).replace(
      /(lt|gt|lte|gte)/g,
      (operator) => `$${operator}`,
    );
    console.log('req obj filtering',JSON.parse(queryObj))
    this.query = this.query.find(JSON.parse(queryObj));
    return this;
  }

  sorting() {
  console.log('reqest sorting',this.queryStr)

    if (this.queryStr.sort) {
      this.query = this.query.sort(this.queryStr.sort.split(',').join(' '));
    }
    return this;
  }

  fields() {
    console.log('fields', this.queryStr.fields)
    if (this.queryStr.fields) {
      const fields = this.queryStr.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  limit() {
    //limiting records
    if (this.queryStr.limit) {
      this.query = this.query.limit(this.queryStr.limit);
    }
    return this;
  }

  pagination() {
    //pagination
    if (this.queryStr.page) {
      console.log('query ttr', this.queryStr);
      const page = this.queryStr.page * 1;
      const limit = this.queryStr.limit * 1;
      const skipValue = (page - 1) * limit;
      this.query = this.query.skip(skipValue).limit(limit);
    }
    return this;
  }
}

module.exports = ApiFeature;
