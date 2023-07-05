CREATE DATABASE vikretha;
USE vikretha
CREATE TABLE catalog(product_id int  NOT NULL  PRIMARY KEY,product_name varchar(20),category varchar(15),price int,imgurl varchar(150),ratings float);
CREATE TABLE users(userid int AUTO_INCREMENT PRIMARY KEY,username varchar(20),email varchar(30),password varchar(15));
CREATE TABLE cart(userId int,productId int);
CREATE TABLE orders(id INT  AUTO_INCREMENT PRIMARY KEY,orderid varchar(50),userid int,productid int,deliveryDate DATE,quantity INT );
ALTER TABLE cart ADD CONSTRAINT fk_cart_orders FOREIGN KEY(productID) REFERENCES catalog(product_id);
ALTER TABLE cart ADD CONSTRAINT fk_cart_users FOREIGN KEY(userId) REFERENCES users(userid);
ALTER TABLE orders ADD CONSTRAINT fk_orders_users FOREIGN KEY(userid) REFERENCES users(userid); 
ALTER TABLE orders ADD CONSTRAINT fk_orders_products FOREIGN KEY(productid) REFERENCES catalog(product_id);

